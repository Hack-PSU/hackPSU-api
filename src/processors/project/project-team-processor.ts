import { Inject } from 'injection-js';
import { IProjectTeamApiModel, ProjectTeam } from '../../models/project-team/project-team';
import { ProjectTeamFactory } from '../../models/project-team/project-team-factory';
import { IApiReadable, IApiWritable, IDataMapper, IDbResult } from '../../services/database';
import { BaseProcessor } from '../base-processor';

export class ProjectTeamProcessor extends BaseProcessor<ProjectTeam> {
  public apiReader: IApiReadable<ProjectTeam>;
  public apiWriter: IApiWritable<ProjectTeam>;

  constructor(@Inject('ProjectTeamDataMapperImpl') public dataMapper: IDataMapper<ProjectTeam>) {
    super();
    this.apiReader = new ProjectTeamFactory();
    this.apiWriter = new ProjectTeamFactory();
  }

  public async addData(object: IProjectTeamApiModel): Promise<IDbResult<IProjectTeamApiModel>> {
    return super.addData(object) as Promise<IDbResult<IProjectTeamApiModel>>;
  }
}
