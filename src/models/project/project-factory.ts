import * as _ from 'lodash';
import { default as uuid } from 'uuid/v4';
import { ObjectFactory } from '../object-factory';
import { IProjectApiModel, Project } from './project';

export class ProjectFactory extends ObjectFactory<Project> {
  public generateApiRepresentation(data: Project): IProjectApiModel {
    return data.cleanRepresentation as IProjectApiModel;
  }

  public generateDbRepresentation(data: Project): any {
    return data.dbRepresentation;
  }

  public generateFromApi(data: IProjectApiModel): Project {
    if (!data.team || Array.isArray(!data.team)) {
      throw new Error('Team must be provided as a list of UIDs');
    }
    if (!data.categories || Array.isArray(!data.categories)) {
      throw new Error('Categories must be provided as a list of category IDs');
    }
    if (!data.projectName) {
      throw new Error('Project name must be provided');
    }
    return new Project()
      .setCategories(data.categories)
      .setProjectName(data.projectName)
      .setTeam(data.team)
      .setUid(uuid());
  }

  public generateFromDbRepresentation(data: any): Project {
    const project: Project = _.merge(new Project(), data);
    project.setTeam(data.team.split(','));
    project.setCategories(data.categories.split(',').map(cat => parseInt(cat, 10)));
    return project;
  }

}
