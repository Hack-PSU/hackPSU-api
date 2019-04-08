import { UidType } from '../../JSCommon/common-types';
import { IDataMapper, IDbResult } from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { Project } from './project';

export interface IProjectDataMapper extends IDataMapper<Project> {
  assignTable(project: Project): Promise<IDbResult<Project>>;

  get(object: UidType, opts?: IProjectUowOpts): Promise<IDbResult<Project>>;

  getAll(opts?: IProjectUowOpts): Promise<IDbResult<Project[]>>;
}

export interface IProjectUowOpts extends IUowOpts {
  userId?: UidType;
  categoryId?: number;
}
