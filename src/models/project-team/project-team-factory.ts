import * as _ from 'lodash';
import { IApiModel } from '../../services/database';
import { ObjectFactory } from '../object-factory';
import { IProjectTeamApiModel, ProjectTeam } from './project-team';

export class ProjectTeamFactory extends ObjectFactory<ProjectTeam> {
  public generateApiRepresentation(data: ProjectTeam): IApiModel<ProjectTeam> {
    return data.cleanRepresentation as IProjectTeamApiModel;
  }

  public generateDbRepresentation(data: ProjectTeam): any {
    return data.dbRepresentation;
  }

  public generateFromApi(data: IProjectTeamApiModel): ProjectTeam {
    if (!data.userId) {
      throw new Error('User ID must be provided');
    }
    if (!data.projectId) {
      throw new Error('Project ID must be provided');
    }
    return new ProjectTeam()
      .setUserId(data.userId)
      .setProjectId(data.projectId);
  }

  public generateFromDbRepresentation(data: any): ProjectTeam {
    return _.merge(new ProjectTeam(), data);
  }

}
