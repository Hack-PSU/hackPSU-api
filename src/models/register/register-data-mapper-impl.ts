import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as squel from 'squel';
import { ICompoundHackathonUidType, UidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { Hackathon } from '../hackathon';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { IRegisterDataMapper } from './index';
import { IRegistrationStats, Registration } from './registration';

@Injectable()
export class RegisterDataMapperImpl extends GenericDataMapper
  implements IRegisterDataMapper, IAclPerm {

  public CREATE: string = 'registration:create';
  public DELETE: string = 'registration:delete';
  public READ: string = 'registration:read';
  public READ_ALL: string = 'registration:readall';
  public UPDATE: string = 'registration:update';
  public COUNT: string = 'registration:count';

  public tableName: string = 'REGISTRATION';
  protected pkColumnName: string = 'uid';

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IActiveHackathonDataMapper') protected readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl);
    super.addRBAC(
      [this.DELETE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.TEAM_MEMBER]],
    );
    super.addRBAC(
      [this.READ_ALL, this.COUNT],
      [AuthLevel.VOLUNTEER],
      undefined,
      [AuthLevel[AuthLevel.PARTICIPANT]],
    );
    super.addRBAC(
      [this.READ, this.UPDATE, this.CREATE],
      [AuthLevel.PARTICIPANT],
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

  public get(id: ICompoundHackathonUidType, opts?: IUowOpts): Promise<IDbResult<Registration>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'registration');
    if (opts && opts.fields) {
      queryBuilder = queryBuilder
        .fields(opts.fields);
    } else {
      queryBuilder = queryBuilder
        .field('registration.*')
        .fields(['hackathon.name', 'hackathon.start_time', 'hackathon.end_time', 'hackathon.base_pin', 'hackathon.active']);
    }
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    queryBuilder = queryBuilder
      .where(`registration.${this.pkColumnName}= ?`, id.uid)
      .where('registration.hackathon = ?', id.hackathon)
      .join('HACKATHON', 'hackathon', 'hackathon.uid = registration.hackathon')
      .order('time', false);
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: checkCache },
    ))
      .pipe(
        map((event: Registration[]) => ({ result: 'Success', data: event[0] })),
        map((value) => {
          value.data.time = parseInt(value.data.time as any as string, 10);
          return value;
        }),
      )
      .toPromise();
  }

  public async getAll(opts?: IUowOpts): Promise<IDbResult<Registration[]>> {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName, 'registration')
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'registration.hackathon = hackathon.uid',
      );
    if (opts && opts.fields) {
      queryBuilder = queryBuilder
        .fields(opts.fields);
    } else {
      queryBuilder = queryBuilder
      .field('registration.*')
      .fields(['hackathon.name', 'hackathon.start_time', 'hackathon.end_time', 'hackathon.base_pin', 'hackathon.active']);
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
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: checkCache },
    ))
      .pipe(
        map((registrations: Registration[]) => ({ result: 'Success', data: registrations })),
      )
      .toPromise();
  }
  public async getCount(opts?: IUowOpts): Promise<IDbResult<number>> {
    const query = (await this.getCountQuery(opts)).toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<number>(query.text, query.values, { cache: true }),
    ).pipe(
      map((result: number[]) => ({ result: 'Success', data: result[0] })),
    ).toPromise();
  }

  public async getCountQuery(opts?: IUowOpts) {
    let queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'registration_count');
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

  public async insert(object: Registration): Promise<IDbResult<Registration>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      throw new HttpError(validation.error, 400);
    }
    let queryBuilder = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([object.dbRepresentation])
      .set(
        'hackathon',
        await this.activeHackathonDataMapper.activeHackathon.pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      );
    if (!object.time) {
      queryBuilder = queryBuilder
        .set('time', Date.now());
    }
    const query = queryBuilder
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: object.cleanRepresentation })),
    ).toPromise();
  }

  public async submit(object: Registration): Promise<IDbResult<boolean>> {
    const query = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('submitted', true)
      .where('uid = ?', object.id)
      .where(
        'hackathon = ?',
        await this.activeHackathonDataMapper.activeHackathon
          .pipe(map(hackathon => hackathon.uid))
          .toPromise(),
      )
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: true })),
    ).toPromise();
  }

  public async update(object: Registration): Promise<IDbResult<Registration>> {
    const currentDbObject = await this.get({ uid: object.id!, hackathon: object.hackathon });
    const currentObject = object.merge(object, currentDbObject.data);
    const validation = currentObject.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while updating object.');
      this.logger.warn(currentObject.dbRepresentation);
      throw new HttpError(validation.error, 400);
    }
    /**
     * On line 226, await this.get() executes a join on the Registration table with the Hackathon table.
     * As a result, currentDbObject contains fields from the Hackathon table, i.e. 'name', 'base_pin', 'start_time', 'end_time', and active'.
     * These fields are not valid for the Registration table and thus need to be removed from the currentDbObject.
     */
    const dbRep = currentObject.dbRepresentation;
    delete dbRep.base_pin;
    delete dbRep.end_time;
    delete dbRep.start_time;
    delete dbRep.name;
    delete dbRep.active;

    const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .table(this.tableName)
      .setFields(dbRep)
      .where(`${this.pkColumnName} = ?`, currentObject.id)
      .where('hackathon = ?', currentObject.hackathon)
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<void>(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: currentObject.cleanRepresentation })),
    ).toPromise();
  }

  public getCurrent(id: UidType, opts?: IUowOpts): Promise<IDbResult<Registration>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(this.tableName, 'registration');
    queryBuilder = opts && opts.fields ?
      queryBuilder.fields(opts.fields) :
      queryBuilder.field('registration.*');
    const query = queryBuilder
      .field('registration.pin - hackathon.base_pin', 'pin')
      .where(`registration.${this.pkColumnName}= ?`, id)
      .join(
        this.activeHackathonDataMapper.tableName,
        'hackathon',
        'registration.hackathon = hackathon.uid and hackathon.active = 1',
      )
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((event: Registration[]) => ({ result: 'Success', data: event[0] })),
      )
      .toPromise();
  }

  public async getRegistrationStats(opts?: IUowOpts): Promise<IDbResult<IRegistrationStats[]>> {
    const columnNames = [
      'academic_year',
      'coding_experience',
      'dietary_restriction',
      'travel_reimbursement',
      'race',
      'shirt_size',
      'gender',
      'first_hackathon',
      'veteran',
    ];
    let queryBuilder;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < columnNames.length; i += 1) {
      queryBuilder = !queryBuilder ?
        await this.getSelectQueryForOptionName(columnNames[i], opts) :
        queryBuilder.union(await this.getSelectQueryForOptionName(columnNames[i], opts));
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<IRegistrationStats>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((event: IRegistrationStats[]) => ({ result: 'Success', data: event })),
      )
      .toPromise();
  }

  public getEmailByUid(uid: UidType): Promise<IDbResult<string>> {
    const query = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field('email')
      .where('uid = ?', uid)
      .toParam();
    query.text = query.text.concat(';');
    return from(this.sql.query<string>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((email: string) => ({ result: 'Success', data: email })),
      )
      .toPromise();
  }

  /**
   * Returns a generated query for counting the statistics for
   * a given table column
   */
  public async getSelectQueryForOptionName(fieldname: string, opts?: IUowOpts) {
    let queryBuilder = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .field(`"${fieldname}"`, 'CATEGORY')
      .field(fieldname, 'OPTION')
      .field('COUNT(*)', 'COUNT');
    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .join(
          this.activeHackathonDataMapper.tableName,
          'hackathon',
          `hackathon.uid = ${this.tableName}.hackathon`,
        )
        .where(
          'hackathon.uid = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.activeHackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
    }
    return queryBuilder.group(fieldname);
  }

  public getByPin(pin: number, hackathon: Hackathon): Promise<IDbResult<Registration>> {
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .where('hackathon = ?', hackathon.uid)
      .where('pin = ?', hackathon.base_pin! + pin)
      .toParam();
    return from(this.sql.query<Registration>(
      query.text,
      query.values,
      { cache: true },
    ))
      .pipe(
        map((registration: Registration[]) => ({ result: 'Success', data: registration[0] })),
      )
      .toPromise();
  }
}
