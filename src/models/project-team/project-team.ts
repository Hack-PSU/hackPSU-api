import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import { IApiModel } from '../../services/database';
import BaseObject from '../BaseObject';

const projectSchema = jsonAssetLoader('projectTeamSchema');

export interface IProjectTeamApiModel extends IApiModel<ProjectTeam> {
  userId: UidType;
  projectId: UidType;
}

export class ProjectTeam extends BaseObject {
  private userID: UidType;
  private projectID: UidType;

  constructor() {
    super();
  }

  public getUserId() {
    return this.userID;
  }

  public getProjectId() {
    return this.projectID;
  }

  public setUserId(userId: UidType) {
    this.userID = userId;
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
