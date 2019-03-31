import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import { UidType } from '../../../js-common/common-types';
import { MethodNotImplementedError } from '../../../js-common/errors';
import { AuthLevel, IFirebaseAuthService } from '../../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { FeatureFlagService } from '../../../services/common/feature-flags/feature-flag-service';
import { IDbResult } from '../../../services/database';
import { GenericDataMapper } from '../../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../../services/database/svc/mysql-uow.service';
import { IUowOpts } from '../../../services/database/svc/uow.service';
import { IActiveHackathonDataMapper } from '../../hackathon/active-hackathon';
import { IPreRegisterDataMapper, IRegisterDataMapper } from '../../register';
import { IRsvpDataMapper } from '../../rsvp';
import { IScannerDataMapper } from '../../scanner';
import { IAdminStatisticsDataMapper, IUserCount, IUserStatistics } from './index';

@Injectable()
export class AdminStatisticsDataMapperImpl extends GenericDataMapper
  implements IAdminStatisticsDataMapper, IAclPerm {
  public READ: string = 'statistics:read';
  // Undefined properties for Statistics data mapper
  public COUNT: string;
  public CREATE: string;
  public DELETE: string;
  public READ_ALL: string;
  public UPDATE: string;
  public tableName: string;
  protected pkColumnName: string;

  constructor(
    @Inject('IAcl') readonly acl: IAcl,
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('MysqlUow') private readonly sql: MysqlUow,
    @Inject('IPreRegisterDataMapper') private readonly preRegDataMapper: IPreRegisterDataMapper,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IRsvpDataMapper') private readonly rsvpDataMapper: IRsvpDataMapper,
    @Inject('IScannerDataMapper') private readonly scannerDataMapper: IScannerDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly hackathonDataMapper: IActiveHackathonDataMapper,
  ) {
    super(acl);
    super.addRBAC(
      this.READ,
      [AuthLevel.TEAM_MEMBER],
      undefined,
      [AuthLevel[AuthLevel.VOLUNTEER]],
    );
  }

  public async getUserCountByCategory(opts?: IUowOpts): Promise<IDbResult<IUserCount[]>> {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(
        this.preRegDataMapper.getCountQuery(),
        'a',
      )
      .join(
        await this.registerDataMapper.getCountQuery(opts),
        'b',
      )
      .join(
        await this.rsvpDataMapper.getCountQuery(opts),
        'c',
      )
      .join(
        await this.scannerDataMapper.getCountQuery(opts),
        'd',
      )
      .toParam();
    query.text = query.text.concat(';');
    let checkCache = true;
    if (opts && opts.ignoreCache) {
      checkCache = false;
    }
    return from(
      this.sql.query<IUserCount>(query.text, query.values, { cache: checkCache }),
    ).pipe(
      map((result: IUserCount[]) => ({ result: 'Success', data: result })),
    ).toPromise();
  }

  public async getAllUserData(opts?: IUowOpts): Promise<IDbResult<IUserStatistics[]>> {
    let queryBuilder = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .distinct()
      .field('pre_reg.uid', 'pre_uid')
      .field('reg.*')
      .field('reg.pin - hackathon.base_pin', 'pin')
      .field('hackathon.name')
      .field('hackathon.start_time')
      .field('hackathon.end_time')
      .field('hackathon.base_pin')
      .field('hackathon.active')
      .field('rsvp.user_id')
      .field('rsvp.rsvp_time')
      .field('rsvp.rsvp_status')
      .field('rfid.user_uid')
      .from(this.preRegDataMapper.tableName, 'pre_reg')
      .right_join(this.registerDataMapper.tableName, 'reg', 'pre_reg.email = reg.email')
      .join(this.hackathonDataMapper.tableName, 'hackathon', 'reg.hackathon = hackathon.uid')
      // TODO: Change to the table name field once rsvp data mapper is created
      .left_join('rsvp', 'rsvp', 'reg.uid = rsvp.user_id')
      // TODO: Change to the table name field once rfid data mapper is created
      .left_join('RFID_ASSIGNMENTS', 'rfid', 'reg.uid = rfid.user_uid');

    if (opts && opts.byHackathon) {
      queryBuilder = queryBuilder
        .where(
          'reg.hackathon = ?',
          await (opts.hackathon ?
            Promise.resolve(opts.hackathon) :
            this.hackathonDataMapper.activeHackathon
              .pipe(map(hackathon => hackathon.uid))
              .toPromise()),
        );
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
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query<IUserStatistics>(query.text, query.values, { cache: checkCache }),
    ).pipe(
      map((result: IUserStatistics[]) => ({ result: 'Success', data: result })),
    ).toPromise();
  }
}
