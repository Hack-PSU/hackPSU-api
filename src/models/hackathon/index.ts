import { EpochNumber, UidType } from '../../js-common/common-types';
import { Hackathon } from './hackathon';
import { HackathonDataMapperImpl } from './hackathon-data-mapper-impl';

interface IHackathonApiModel {
  basePin: number | null;
  endTime: EpochNumber | null;
  startTime?: EpochNumber;
  name: string;
  uid?: UidType;
}

// interface IHackathonDataMapper extends IDataMapper {
//   tableName: string;
//
//   get(id: UidType): Promise<IDbResult<Hackathon>>;
//
//   insert(object: Hackathon): Promise<IDbResult<Hackathon>>;
//
//   update(object: Hackathon): Promise<IDbResult<Hackathon>>;
//
//   delete(id: UidType): Promise<IDbResult<void>>;
//
//   getAll(): Promise<IDbResult<Stream<Hackathon>>>;
//
//   getCount(): Promise<IDbResult<number>>;
// }

export { IHackathonApiModel, Hackathon, /*IHackathonDataMapper,*/ HackathonDataMapperImpl };
