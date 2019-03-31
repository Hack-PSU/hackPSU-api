import { Observable } from 'rxjs';
import { UidType } from '../../../js-common/common-types';
import { IDataMapper, IDbResult } from '../../../services/database';
// import { IHackathonDataMapper } from '../index';
import { ActiveHackathon } from './active-hackathon';
import { ActiveHackathonDataMapperImpl } from './active-hackathon-data-mapper-impl';

interface IActiveHackathonDataMapper extends IDataMapper<ActiveHackathon> {
  readonly tableName: string;

  readonly activeHackathon: Observable<ActiveHackathon>;

  makeActive(id: UidType): Promise<IDbResult<ActiveHackathon>>;
}
export { IActiveHackathonDataMapper, ActiveHackathonDataMapperImpl };
