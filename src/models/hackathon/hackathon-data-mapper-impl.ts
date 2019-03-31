import { Inject } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import { UidType } from '../../js-common/common-types';
import { HttpError, MethodNotImplementedError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { Hackathon } from './hackathon';

export class HackathonDataMapperImpl extends GenericDataMapper
  implements IDataMapper<Hackathon>, IAclPerm {

  public readonly CREATE: string = 'hackathon:create';
  public readonly DELETE: string = 'hackathon:delete';
  public readonly READ: string = 'hackathon:read';
  public readonly UPDATE: string = 'hackathon:update';
  public readonly READ_ALL: string = 'hackathon:readall';
  public readonly COUNT: string = 'hackathon:count';
  public tableName: string = 'HACKATHON';

  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.CREATE, this.UPDATE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.TEAM_MEMBER]],
    );
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.TECHNOLOGY],
      undefined,
      [AuthLevel[AuthLevel.DIRECTOR]],
    );
    super.addRBAC(
      [this.READ, this.READ_ALL, this.COUNT],
      [
        AuthLevel.PARTICIPANT,
      ],
    );
  }

  public delete(id: UidType): Promise<IDbResult<void>> {
    throw new MethodNotImplementedError('Cannot delete Hackathon entry yet');
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<Hackathon>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Hackathon>(query.text, query.values, { cache: true }))
      .pipe(
        map((event: Hackathon[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public getAll(): Promise<IDbResult<Hackathon[]>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .toParam();
    query.text = query.text
      .concat(';');
    return from(this.sql.query<Hackathon>(query.text, query.values, { cache: true }))
      .pipe(
        map((hackathons: Hackathon[]) => ({ result: 'Success', data: hackathons })),
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

  public insert(object: Hackathon): Promise<IDbResult<Hackathon>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    let queryBuilder = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation]);
    if (object.base_pin === undefined || object.base_pin === null) {
      queryBuilder = queryBuilder.set(
        'base_pin',
        squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: false })
          .from('REGISTRATION LOCK IN SHARE MODE')
          .field('MAX(pin)'),
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

  public async update(object: Hackathon): Promise<IDbResult<Hackathon>> {
    const currentDbObject = await this.get(object.id);
    const currentObject = object.merge(currentDbObject.data, object);
    const validation = currentObject.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(currentObject.dbRepresentation);
      return Promise.reject(new HttpError(validation.error, 400));
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(currentObject.dbRepresentation)
      .where(`${this.pkColumnName} = ?`, currentObject.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: currentObject.cleanRepresentation })),
    ).toPromise();
  }
}
