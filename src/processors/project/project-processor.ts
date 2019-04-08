import { Inject } from 'injection-js';
import { UidType } from '../../JSCommon/common-types';
import { HttpError } from '../../JSCommon/errors';
import { Category } from '../../models/category/category';
import { IProjectDataMapper, IProjectUowOpts } from '../../models/project';
import { IProjectApiModel, IProjectApiResponseModel, Project } from '../../models/project/project';
import { ProjectFactory } from '../../models/project/project-factory';
import { IRegisterDataMapper } from '../../models/register';
import {
  IApiModel,
  IApiReadable,
  IApiWritable,
  IDataMapper,
  IDbResult,
} from '../../services/database';
import { IUowOpts } from '../../services/database/svc/uow.service';
import { BaseProcessor } from '../base-processor';

export class ProjectProcessor extends BaseProcessor<Project> {
  protected apiReader: IApiReadable<Project>;
  protected apiWriter: IApiWritable<Project>;

  constructor(
    @Inject('ProjectDataMapperImpl') protected readonly dataMapper: IProjectDataMapper,
    @Inject('RegisterDataMapperImpl') protected readonly registerDataMapper: IRegisterDataMapper,
    @Inject('CategoryDataMapperImpl') protected readonly categoryDataMapper: IDataMapper<Category>,
  ) {
    super();
    this.apiReader = new ProjectFactory();
    this.apiWriter = new ProjectFactory();
  }

  public async addData(object: IProjectApiModel): Promise<IDbResult<IProjectApiModel>> {
    // Validate fields first
    const project = this.apiReader.generateFromApi(object);
    // If all gets succeed, registrations and categories are valid
    await this.retrieveNestedFields(project.getTeam(), project.getCategories());

    if (project.getTeam().length > 5) {
      throw new HttpError('Too many team members', 400);
    }
    return super.addData(object) as Promise<IDbResult<IProjectApiModel>>;
  }

  public async getData(
    uid: string,
    opts?: IProjectUowOpts,
  ): Promise<IDbResult<IApiModel<Project>>> {
    const projectsResult = await this.dataMapper.get(uid, opts);
    return {
      result: projectsResult.result,
      data: await this.getProjectResponseRepresentation(projectsResult.data),
    };
  }

  public async getAllData(opts?: IUowOpts): Promise<IDbResult<IProjectApiResponseModel[]>> {
    const projectsResult = await this.dataMapper.getAll(opts);
    return {
      result: projectsResult.result,
      data: await Promise.all(projectsResult.data.map(project => this.getProjectResponseRepresentation(project))),
    };
  }

  public async assignTable(projectId: UidType) {
    const { data: project } = await this.dataMapper.get(projectId);
    return this.dataMapper.assignTable(project);
  }

  private async getProjectResponseRepresentation(project) {
    const { team, categories } = await this.retrieveNestedFields(
      project.getTeam(),
      project.getCategories(),
    );
    const projectResponse: any = this.apiWriter.generateApiRepresentation(project);
    projectResponse.categories = categories;
    projectResponse.team = team;
    return projectResponse as IProjectApiResponseModel;
  }

  private async retrieveNestedFields(team: string[], categories: number[]) {
    const retrievedTeam = await Promise.all(team.map(async (uid) => {
      const registrationResult = await this.registerDataMapper.getCurrent(uid, { fields: ['firstname', 'lastname', 'email'] });
      return registrationResult.data;
    }));
    const retrievedCategories = await Promise.all(categories.map(async (catId) => {
      const categoryResult = await this.categoryDataMapper.get(catId);
      return categoryResult.data;
    }));
    return { team: retrievedTeam, categories: retrievedCategories };
  }
}
