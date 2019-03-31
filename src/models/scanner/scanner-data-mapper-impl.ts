import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import { ICompoundHackathonUidType } from '../../js-common/common-types';
import { HttpError, MethodNotImplementedError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import BaseObject from '../BaseObject';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IScannerDataMapper } from './index';
import { RfidAssignment } from './rfid-assignment';
import { Scan } from './scan';

@Injectable()
export class ScannerDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IScannerDataMapper {

  private static handleInsertionError<T extends BaseObject>(error: Error, object: T): IDbResult<T> {
    switch ((error as HttpError).status) {
      case 400:
        return { result: 'Bad input', data: object.cleanRepresentation };
      case 409:
        return {
          data: object.cleanRepresentation,
          result: 'Duplicate detected',
        };
      default:
        return {
          data: object.cleanRepresentation,
          result: 'Error',
        };
    }
  }
  public COUNT: string = 'rfidassignment:count';
  public CREATE: string = 'rfidassignment:create';
  public READ_ALL: string = 'rfidassignment:readall';
  public UPDATE: string = 'rfidassignment:update';
  // Unsupported operations
  public READ: string;
  public DELETE: string;

  public tableName: string = 'RFID_ASSIGNMENTS';
  public scansTableName = 'SCANS';
  protected pkColumnName: string = 'rfid_uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE, this.UPDATE, this.COUNT, this.READ_ALL],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
  }

  public delete(object: ICompoundHackathonUidType): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  /**
   * Returns an RFID assignment object from a wid
   */
  public async get(
    wid: ICompoundHackathonUidType,
    opts?: IUowOpts,
  ): Promise<IDbResult<RfidAssignment>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, wid.uid);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<RfidAssignment>(query.text, query.values, { cache: true }))
      .pipe(
        map((rfidAssignment: RfidAssignment[]) => ({ result: 'Success', data: rfidAssignment[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<any[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'wid_assignments')
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'wid_assignments.hackathon = hackathon.uid',
      );
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon.uid = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    const query = queryBuilder
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<RfidAssignment>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((registrations: RfidAssignment[]) => ({ result: 'Success', data: registrations })),
      )
      .toPromise();
  }

  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = (await this.getCountQuery(opts))
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public async insert(object: RfidAssignment): Promise<IDbResult<RfidAssignment>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject(new HttpError(validation.error, 400));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFields(object.dbRepresentation)
      .set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      )
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public update(object: RfidAssignment): Promise<IDbResult<RfidAssignment>> {
    throw new MethodNotImplementedError('This method is not supported by this class');
  }

  public async addRfidAssignments(assignments: RfidAssignment[]): Promise<IDbResult<Array<IDbResult<RfidAssignment>>>> {
    let resultString: string = 'Success';
    const result = await Promise.all(
      assignments.map(
        // Handle any insertion errors here and
        // change return an IDbResult with result: error
        async (assignment, index) => {
          try {
            return await this.insert(assignment);
          } catch (error) {
            resultString = 'Error';
            return ScannerDataMapperImpl.handleInsertionError<RfidAssignment>(
              error,
              assignment,
            );
          }
        },
      ));
    return {
      data: result,
      result: resultString,
    };
  }

  public async addScans(scans: Scan[]): Promise<IDbResult<Array<IDbResult<Scan>>>> {
    let resultString: string = 'Success';
    const result = await Promise.all(
      scans.map(
        // Handle any insertion errors here and
        // change return an IDbResult with result: error
        async (scan, index) => {
          try {
            return await this.addSingleScan(scan);
          } catch (error) {
            resultString = 'Error';
            return ScannerDataMapperImpl.handleInsertionError<Scan>(
              error,
              scan,
            );
          }
        },
      ));
    return {
      data: result,
      result: resultString,
    };
  }

  public async addSingleScan(scan: Scan): Promise<IDbResult<Scan>> {
    const validation = scan.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(scan.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.scansTableName)
      .setFields(scan.dbRepresentation)
      .set('hackathon', await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid)).toPromise())
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: scan.cleanRepresentation })),
    ).toPromise();
  }

  public async getCountQuery(opts?: IUowOpts) {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'checkin_count');
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    return queryBuilder;
  }

  public async getAllScans(opts?: IUowOpts): Promise<IDbResult<Scan[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'scans')
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'scans.hackathon = hackathon.uid',
      );
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'hackathon.uid = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    const query = queryBuilder
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Scan>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((registrations: Scan[]) => ({ result: 'Success', data: registrations })),
      )
      .toPromise();
  }
}
