import { ICompoundHackathonUidType, Omit, UidType } from '../../js-common/common-types';
import { IUowOpts } from './svc/uow.service';

export interface IDataMapper<T> {
  tableName: string;

  get(object: UidType, opts?: IUowOpts): Promise<IDbResult<T>>;

  insert(object: T): Promise<IDbResult<T>>;

  update(object: T): Promise<IDbResult<T>>;

  delete(object: T | UidType): Promise<IDbResult<void>>;

  getAll(opts?: IUowOpts): Promise<IDbResult<T[]>>;

  getCount(opts?: IUowOpts): Promise<IDbResult<number>>;
}

export interface IDataMapperHackathonSpecific<T> extends Omit<IDataMapper<T>, 'delete' | 'get'> {
  delete(object: ICompoundHackathonUidType): Promise<IDbResult<void>>;

  get(object: ICompoundHackathonUidType, opts?: IUowOpts): Promise<IDbResult<T>>;
}

export interface IDbResult<T> {
  result: string;
  data: T;
}
