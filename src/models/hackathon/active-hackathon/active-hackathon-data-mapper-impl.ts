import { Inject, Injectable } from 'injection-js';
import { from, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import * as squel from 'squel';
import { UidType } from '../../../js-common/common-types';
import { AuthLevel } from '../../../services/auth/auth-types';
import { IAcl, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { MysqlUow } from '../../../services/database/svc/mysql-uow.service';
import { Logger } from '../../../services/logging/logging';
import { HackathonDataMapperImpl } from '../hackathon-data-mapper-impl';
import { ActiveHackathon } from './active-hackathon';
import { IActiveHackathonDataMapper } from './index';

@Injectable()
export class ActiveHackathonDataMapperImpl extends HackathonDataMapperImpl
  implements IActiveHackathonDataMapper, IAclPerm {

  public get activeHackathon(): Observable<ActiveHackathon> {
    const query = this.getActiveHackathonQuery().toParam();
    if (!this.hackathonObservable) {
      this.hackathonObservable = from(this.sql.query(
        query.text,
        query.values,
      ))
        .pipe(
          map((hackathons: ActiveHackathon[]) => hackathons[0]),
          map((hackathon: ActiveHackathon) => {
            hackathon.base_pin = parseInt(hackathon.base_pin! as any as string, 10);
            return hackathon;
          }),
          shareReplay(),
        );
    }
    return this.hackathonObservable;
  }

  public CREATE: string = 'active-hackathon:create';
  public DELETE: string = 'active-hackathon:delete';
  public READ: string = 'active-hackathon:read';
  public UPDATE: string = 'active-hackathon:update';
  public COUNT: string = 'active-hackathon:count';
  private hackathonObservable?: Observable<ActiveHackathon>;

  constructor(
    @Inject('IAcl') acl: IAcl,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('BunyanLogger') protected readonly logger: Logger,
  ) {
    super(acl, sql, logger);
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
      [this.READ, this.READ_ALL],
      [
        AuthLevel.PARTICIPANT,
      ],
    );
  }

  public makeActive(id: UidType): Promise<IDbResult<ActiveHackathon>> {
    // Make current hackathon inactive
    const activeQuery = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('active', false)
      .set('end_time', Date.now().toString())
      .where('active = ?', true)
      .toParam();
    // Make provided hackathon active
    const newHackathonQuery = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('active', true)
      .set('base_pin', squel.select({
        autoQuoteFieldNames: false,
        autoQuoteTableNames: false,
      })
        .from('REGISTRATION FOR UPDATE')
        .field('MAX(pin)'))
      .where(`${this.pkColumnName} = ?`, id)
      .toParam();
    const query = {
      text: activeQuery.text.concat(';').concat(newHackathonQuery.text).concat(';'),
      values: activeQuery.values.concat(newHackathonQuery.values),
    };
    return from(
      this.sql.query<any>(query.text, query.values, { cache: false }),
    )
      .pipe(
        // Update hackathon observable
        switchMap(() => {
          this.hackathonObservable = undefined;
          return this.activeHackathon;
        }),
        map((hackathon: ActiveHackathon) => ({ result: 'Success', data: hackathon })),
      )
      .toPromise();
  }

  private getActiveHackathonQuery() {
    return squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(this.tableName)
      .where('active = ?', true);
  }
}
