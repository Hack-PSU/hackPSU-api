import * as _ from 'lodash';
import { IApiModel } from '../../services/database';
import { ObjectFactory } from '../object-factory';
import { IProjectCategoryApiModel, ProjectCategory } from './project-category';

export class ProjectCategoryFactory extends ObjectFactory<ProjectCategory> {
  public generateApiRepresentation(data: ProjectCategory): IApiModel<ProjectCategory> {
    return data.cleanRepresentation as IProjectCategoryApiModel;
  }

  public generateDbRepresentation(data: ProjectCategory): any {
    return data.dbRepresentation;
  }

  public generateFromApi(data: IProjectCategoryApiModel): ProjectCategory {
    if (!data.categoryId) {
      throw new Error('Category ID must be provided and be a number');
    }
    if (!data.projectId) {
      throw new Error('Project ID must be provided');
    }
    return new ProjectCategory()
      .setCategoryId(data.categoryId)
      .setProjectId(data.projectId);
  }

  public generateFromDbRepresentation(data: any): ProjectCategory {
    return _.merge(new ProjectCategory(), data);
  }

}
