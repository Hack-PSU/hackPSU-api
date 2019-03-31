import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { UidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { Location } from './location';

@Injectable()
export class LocationDataMapperImpl extends GenericDataMapper
  implements IDataMapper<Location>, IAclPerm {
  // ACL permissions
  public readonly CREATE: string = 'location:create';
  public readonly DELETE: string = 'location:delete';
  public readonly READ: string = 'location:read';
  public readonly UPDATE: string = 'location:update';
  public readonly READ_ALL: string = 'location:readall';
  public readonly COUNT: string = 'location:count';
  public tableName = 'LOCATIONS';

  protected pkColumnName = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE, this.UPDATE, this.DELETE],
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
    super.addRBAC([this.READ, this.READ_ALL], [AuthLevel.PARTICIPANT]);
  }

  public delete(object: Location): Promise<IDbResult<void>> {
    const query = squel
      .delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    )
      .pipe(map(() => ({ result: 'Success', data: undefined })))
      .toPromise();
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<Location>> {
    let queryBuilder = squel
      .select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    queryBuilder = queryBuilder.where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<Location>(query.text, query.values, {
        cache: checkCache,
      }),
    )
      .pipe(
        map((location: Location[]) => ({ result: 'Success', data: location[0] })),
      )
      .toPromise();
  }

  public getAll(opts?: IUowOpts): Promise<IDbResult<Location[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    }).from(this.tableName, 'location');
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    if (opts && opts.startAt) {
      queryBuilder = queryBuilder.offset(opts.startAt);
    }
    if (opts && opts.count) {
      queryBuilder = queryBuilder.limit(opts.count);
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<Location>(query.text, query.values, { cache: true }),
    )
      .pipe(
        map((locations: Location[]) => ({
          data: locations,
          result: 'Success',
        })),
      )
      .toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    const query = squel
      .select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toParam();
    query.text = query.text
      .concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    )
      .pipe(map((result: number[]) => ({ result: 'Success', data: result[0] })))
      .toPromise();
  }

  public insert(object: Location): Promise<IDbResult<Location>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({
        data: new HttpError(validation.error, 400),
        result: 'error',
      });
    }
    const query = squel
      .insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, {
        cache: false,

      }),
    )
      .pipe(map(() => ({ result: 'Success', data: object })))
      .toPromise();
  }

  public update(object: Location): Promise<IDbResult<Location>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({
        data: new HttpError(validation.error, 400),
        result: 'error',
      });
    }
    const query = squel
      .update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(object.dbRepresentation)
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }
}
