import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import { IApiModel } from '../../services/database';
import BaseObject from '../BaseObject';

const projectSchema = jsonAssetLoader('projectCategorySchema');

export interface IProjectCategoryApiModel extends IApiModel<ProjectCategory> {
  categoryId: number;
  projectId: UidType;
}

export class ProjectCategory extends BaseObject {
  private categoryID: number;
  private projectID: UidType;

  constructor() {
    super();
  }

  public getCategoryId() {
    return this.categoryID;
  }

  public getProjectId() {
    return this.projectID;
  }

  public setCategoryId(categoryId: number) {
    this.categoryID = categoryId;
    return this;
  }

  public setProjectId(projectId: UidType) {
    this.projectID = projectId;
    return this;
  }

  public get uid() {
    return this;
  }

  protected get schema(): any {
    return projectSchema;
  }
}
