import { Inject } from 'injection-js';
import { default as NodeTimeUuid } from 'node-time-uuid';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IUpdateDataMapper } from '.';
import { ICompoundHackathonUidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { AuthLevel } from '../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { RtdbQueryType, RtdbUow } from '../../services/database/svc/rtdb-uow.service';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Logger } from '../../services/logging/logging';
import { IActiveHackathonDataMapper } from '../hackathon/active-hackathon';
import { Update } from './update';

export class UpdateDataMapperImpl extends GenericDataMapper implements IUpdateDataMapper, IAclPerm {
  public readonly CREATE: string = 'event:create';
  public readonly DELETE: string = 'event:delete';
  public readonly READ: string = 'event:read';
  public readonly UPDATE: string = 'event:update';
  public readonly READ_ALL: string = 'event:readall';
  public readonly COUNT: string = 'event:count';
  public tableName = 'updates';

  protected pkColumnName = '';

  constructor(
    @Inject('IAcl') protected readonly acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('RtdbUow') protected readonly rtdb: RtdbUow,
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
      [this.READ_ALL, this.READ],
      [
        AuthLevel.PARTICIPANT,
      ],
    );
  }

  public delete(id: ICompoundHackathonUidType): Promise<IDbResult<void>> {
    return from(
      this.rtdb.query<void>(
        RtdbQueryType.DELETE,
        [`${this.tableName}/${id.hackathon}/${id.uid}`],
        { cache: false },
      ),
    ).pipe(
        map(() => ({ result: 'Success', data: undefined })),
      )
      .toPromise();
  }

  public get(id: ICompoundHackathonUidType, opts?: IUowOpts): Promise<IDbResult<Update>> {
    return from(
      this.rtdb.query<Update>(
        RtdbQueryType.GET,
        [`${this.tableName}/${id.hackathon}/${id.uid}`],
        { cache: true },
      ))
      .pipe(
        map(result => ({ result: 'Success', data: result as Update })),
      ).toPromise();
  }

  public getAll(): Promise<IDbResult<Update[]>> {
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        map(hackathon => hackathon.uid),
        switchMap((result) => {
          const reference = `/${this.tableName}/${result}`;
          return from(this.rtdb.query<Update[]>(RtdbQueryType.GET, [reference], undefined));
        }),
        map(data => ({ result: 'Success', data: data as Update[] })),
      ).toPromise();
  }

  public getCount(): Promise<IDbResult<number>> {
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        map(hackathon => hackathon.uid),
        switchMap((result) => {
          const reference = `/${this.tableName}/${result}`;
          return this.rtdb.query<number>(RtdbQueryType.COUNT, [reference], null);
        }),
        map(data => ({ result: 'Success', data: data as number })),
      ).toPromise();
  }

  public insert(object: Update): Promise<IDbResult<Update>> {
    const validation = object.validate();
    if (!validation.result) {
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    const uid = new NodeTimeUuid().toString();
    object.uid = uid;
    return this.activeHackathonDataMapper.activeHackathon
      .pipe(
        map(hackathon => hackathon.uid),
        switchMap(reference =>
          this.rtdb.query<Update>(
            RtdbQueryType.SET,
            [`${this.tableName}/${reference}/${uid}`],
            object.dbRepresentation,
        )),
        map(result => ({ result: 'Success', data: result as Update })),
      ).toPromise();
  }

  public update(object: Update): Promise<IDbResult<Update>> {
    const validation = object.validate();
    if (!validation.result) {
      this.logger.warn('Validation failed while adding object.');
      this.logger.warn(object.dbRepresentation);
      return Promise.reject({ result: 'error', data: new HttpError(validation.error, 400) });
    }
    return this.activeHackathonDataMapper.activeHackathon.pipe(
      map(hackathon => hackathon.uid),
      switchMap(reference => from(
        this.rtdb.query<Update>(
          RtdbQueryType.UPDATE,
          [`${this.tableName}/${reference}/${object.id}`],
          object.dbRepresentation,
        ))),
      map(result => ({ result: 'Success', data: result as Update })),
    ).toPromise();
  }

  public getReference() {
    return this.activeHackathonDataMapper.activeHackathon.pipe(
      map(hackathon => hackathon.uid),
      switchMap((result) => {
        const reference = `/${this.tableName}/${result}`;
        return from(this.rtdb.query<string>(RtdbQueryType.REF, [reference], null));
      }),
      map(result => ({ result: 'Success', data: result as string })),
    )
      .toPromise();
  }
}
