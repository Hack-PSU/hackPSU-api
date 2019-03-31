import { Inject, Injectable } from 'injection-js';
import { default as _ } from 'lodash';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { IStatUowOpts } from '.';
import { MethodNotImplementedError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IRegisterDataMapper } from '../register';
import { Attendance } from './attendance';

export const TABLE_NAME = 'ATTENDANCE';

export interface IAttendanceDataMapper extends IDataMapper<Attendance> {
  getAttendanceByEvent(opts?: IStatUowOpts): Promise<{ result: string; data: any }>;

  getAttendanceByUser(opts?: IStatUowOpts): Promise<{ result: string; data: any }>;
}

/**
 * TODO: Add documentation
 */
@Injectable()
export class AttendanceDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IAttendanceDataMapper {

  get tableName() {
    return TABLE_NAME;
  }

  private static extractRegistrationDetails(attendanceValue: any) {
    return _.pick(
      attendanceValue,
      [
        'user_uid',
        'firstname',
        'lastname',
        'gender',
        'shirt_size',
        'dietary_restriction',
        'allergies',
        'travel_reimbursement',
        'first_hackathon',
        'university',
        'email',
        'academic_year',
        'major',
        'resume',
        'phone',
        'race',
        'coding_experience',
        'referral',
        'project',
        'expectations',
        'veteran',
        'pin',
        'hackathon',
      ],
    );
  }

  private static extractEventDetails(attendanceValue: any) {
    return _.pick(
      attendanceValue,
      [
        'event_uid',
        'event_start_time',
        'event_end_time',
        'event_title',
        'event_description',
        'event_type',
        'event_name',
      ],
    );
  }

  public readonly CREATE: string = 'attendance:create';
  public readonly DELETE: string = 'attendance:delete';
  public readonly READ: string = 'attendance:read';
  public readonly UPDATE: string = 'attendance:update';
  public readonly READ_ALL: string = 'attendance:readall';
  public readonly COUNT: string = 'attendance:count';
  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IRegisterDataMapper') protected readonly registerDataMapper: IRegisterDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.TECHNOLOGY,
      ],
      undefined,
      [AuthLevel[AuthLevel.DIRECTOR]],
    );
  }

  /**
   *
   * @param opts?
   * @return {Promise<Stream>}
   */
  public async getAll(opts?: IUowOpts): Promise<IDbResult<Attendance[]>> {
    let queryBuilder = await this.getAttendanceStatQuery(opts);
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Attendance>(query.text, query.values, { cache: checkCache }))
        .pipe(
          map((attendances: Attendance[]) => ({
            data: attendances,
            result: 'Success',
          })),
        )
        .toPromise();
  }

  /**
   * Returns a count of the number of Attendance objects.
   */
  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count');

    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder.
        where(
          'hackathon_id = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid)).toPromise()),
        );
    }

    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public async getAttendanceByUser(opts?: IStatUowOpts) {
    let queryBuilder = await this.getAttendanceStatQuery(opts);
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    if (opts && opts.uid) {
      queryBuilder = queryBuilder.where('attendance.user_uid = ?', opts.uid);
    }
    const query = queryBuilder
      .order('event_start_time')
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<any>(query.text, query.values, { cache: checkCache }),
    ).pipe(
      map((result: Attendance[]) => {
        // Reduce the result to a condensed object
        return result.reduce(
          (currentAggregation, nextAttendance) => {
            if (currentAggregation[nextAttendance.user_uid]) {
              currentAggregation[nextAttendance.user_uid].events
                .push(AttendanceDataMapperImpl.extractEventDetails(nextAttendance));
            } else {
              currentAggregation[nextAttendance.user_uid] = {
                ...AttendanceDataMapperImpl.extractRegistrationDetails(nextAttendance),
                events: [AttendanceDataMapperImpl.extractEventDetails(nextAttendance)],
              };
            }
            return currentAggregation;
          },
          {},
        );
      }),
      map((result: any) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public async getAttendanceByEvent(opts?: IStatUowOpts) {
    let queryBuilder = await this.getAttendanceStatQuery(opts);
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    if (opts && opts.uid) {
      queryBuilder = queryBuilder.where('attendance.event_uid = ?', opts.uid);
    }
    const query = queryBuilder
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<any>(query.text, query.values, { cache: checkCache }),
    ).pipe(
      map((result: Attendance[]) => {
        // Reduce the result to a condensed object
        return result.reduce(
          (currentAggregation, nextAttendance) => {
            if (currentAggregation[nextAttendance.event_uid]) {
              currentAggregation[nextAttendance.event_uid].attendees
                .push(AttendanceDataMapperImpl.extractRegistrationDetails(nextAttendance));
            } else {
              currentAggregation[nextAttendance.event_uid] = {
                ...AttendanceDataMapperImpl.extractEventDetails(nextAttendance),
                attendees: [AttendanceDataMapperImpl.extractRegistrationDetails(nextAttendance)],
              };
            }
            return currentAggregation;
          },
          {},
        );
      }),
      map((result: any) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public get(uid: string, opts?: IUowOpts): Promise<IDbResult<Attendance>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
  public insert(object: Attendance, opts?: IUowOpts): Promise<IDbResult<Attendance>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
  public update(object: Attendance, opts?: IUowOpts): Promise<IDbResult<Attendance>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }
  public delete(uid: string, opts?: IUowOpts): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  private async getAttendanceStatQuery(opts?: IUowOpts) {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'attendance')
      .join(
        this.registerDataMapper.tableName,
        'registration',
        'attendance.user_uid = registration.uid',
      )
      .distinct();
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder.where(
        'hackathon_id = ?',
        await (opts.hackathon ?
          Promise.resolve(opts.hackathon) :
          this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
            .toPromise()),
      );
      queryBuilder = queryBuilder.where(
        'registration.hackathon = ?',
        await (opts.hackathon ?
          Promise.resolve(opts.hackathon) :
          this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
            .toPromise()),
      );
    }
    return queryBuilder;
  }
}
