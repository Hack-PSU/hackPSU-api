import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbReadable, IDbResult, IDbWritable } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { Category } from './category';
import { CategoryFactory } from './category-factory';

@Injectable()
export class CategoryDataMapperImpl extends GenericDataMapper
  implements IAclPerm, IDataMapper<Category> {
  public readonly COUNT: string = 'category:count';
  public readonly CREATE: string = 'category:create';
  public readonly DELETE: string = 'category:delete';
  public readonly READ: string = 'category:read';
  public readonly READ_ALL: string = 'category:readall';
  public readonly UPDATE: string = 'category:update';

  public tableName = 'CATEGORY_LIST';

  public dbReader: IDbReadable<Category>;
  public dbWriter: IDbWritable<Category>;

  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.READ, this.READ_ALL],
      [
        AuthLevel.TEAM_MEMBER,
      ],
    );
    this.dbReader = new CategoryFactory();
    this.dbWriter = new CategoryFactory();
  }
  public delete(id: UidType): Promise<IDbResult<void>> {
    const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(this.tableName)
      .where(`${this.pkColumnName} = ?`, id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, this.dbReader, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  public get(id: UidType, opts?: IUowOpts): Promise<IDbResult<Category>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName);
    if (opts && opts.fields) {
      queryBuilder = queryBuilder.fields(opts.fields);
    }
    queryBuilder = queryBuilder
      .where(`${this.pkColumnName}= ?`, id);
    const query = queryBuilder
      .toParam();
    query.text = query.text
      .concat(';');
    return from(this.sql.query<Category>(query.text, query.values, this.dbReader, { cache: true }))
      .pipe(
        map((category: Category[]) => ({ result: 'Success', data: category[0] })),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Category[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'category');
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
    return from(this.sql.query<Category>(query.text, query.values, this.dbReader, { cache: true }))
        .pipe(
          map((categories: Category[]) => ({ result: 'Success', data: categories })),
        )
        .toPromise();
  }

  /**
   * Returns a count of the number of Category objects.
   */
  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, undefined, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public insert(object: Category): Promise<IDbResult<Category>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this.dbWriter.generateDbRepresentation(object)])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, this.dbReader, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }

  public update(object: Category): Promise<IDbResult<Category>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(this.dbWriter.generateDbRepresentation(object))
      .where(`${this.pkColumnName} = ?`, object.id)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, this.dbReader, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object })),
    ).toPromise();
  }
}
