import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { Omit, UidType } from '../../JSCommon/common-types';
import { IApiModel } from '../../services/database';
import BaseObject from '../BaseObject';
import { Category } from '../category/category';
import { Registration } from '../register/registration';

const projectSchema = jsonAssetLoader('projectRegistrationSchema');

export interface IProjectApiModel extends IApiModel<Project> {
  projectName: string;
  team: string[];
  categories: number[];
  projectId?: UidType;
}

export interface IProjectApiResponseModel extends Omit<IProjectApiModel, 'team' | 'categories'> {
  team: Registration[];
  categories: Category[];
}

export class Project extends BaseObject {

  public get uid() {
    return this.projectId;
  }

  public get schema(): any {
    return projectSchema;
  }

  private project_name: string;
  private team: string[];
  private categories: number[];
  private projectId?: UidType;
  private tableNumber?: number;

  constructor() {
    super();
  }

  public setProjectName(projectName: string) {
    this.project_name = projectName;
    return this;
  }

  public setTeam(team: string[]) {
    this.team = team;
    return this;
  }

  public setCategories(categories: number[]) {
    this.categories = categories;
    return this;
  }

  public setUid(uid: string) {
    this.projectId = uid;
    return this;
  }

  public getProjectName() { return this.project_name; }

  public getTeam() { return this.team; }

  public getTableNumber() { return this.tableNumber; }

  public getCategories() { return this.categories; }

  public getUid() { return this.projectId!; }
}
