import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { ICompoundHackathonUidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapperHackathonSpecific, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { Event } from './event';

@Injectable()
export class EventDataMapperImpl extends GenericDataMapper
  implements IDataMapperHackathonSpecific<Event>, IAclPerm {
  // ACL permissions
  public readonly CREATE: string = 'event:create';
  public readonly DELETE: string = 'event:delete';
  public readonly READ: string = 'event:read';
  public readonly UPDATE: string = 'event:update';
  public readonly READ_ALL: string = 'event:readall';
  public readonly COUNT: string = 'event:count';
  public tableName = 'EVENTS';

  protected pkColumnName = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('BunyanLogger') protected readonly logger: Logger,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE, this.UPDATE, this.DELETE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.PARTICIPANT,
      ],
    );
  }

  public delete(id: ICompoundHackathonUidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, id.uid)
      .where('hackathon = ?', id.hackathon)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(id: ICompoundHackathonUidType, opts?: IUowOpts): Promise<IDbResult<Event>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id.uid)
      .where('hackathon = ?', id.hackathon);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Event>(query.text, query.values, { cache: checkCache }))
      .pipe(
        map((event: Event[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Event[]>> {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName, 'event')
      .field('event.*')
      .field('location.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'location', 'event_location=location.uid');
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .join(
          'HACKATHON',
          'h',
          'h.uid = event.hackathon',
        )
        .where(
          'h.uid = ?',
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
    return from(this.sql.query<Event>(query.text, query.values, { cache: checkCache }))
      .pipe(
        map((events: Event[]) => events.map((event) => {
          event.event_start_time = parseInt(event.event_start_time as any as string, 10);
          event.event_end_time = parseInt(event.event_end_time as any as string, 10);
          return event;
        })),
        map((event: Event[]) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public async insert(object: Event): Promise<IDbResult<Event>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      throw new HttpError(validation.error, 400);
    }
    let queryBuilder = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation]);
    if (!object.hackathon) {
      queryBuilder = queryBuilder.set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      );
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public update(object: Event): Promise<IDbResult<Event>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      throw new HttpError(validation.error, 400);
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(object.dbRepresentation)
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }
}
