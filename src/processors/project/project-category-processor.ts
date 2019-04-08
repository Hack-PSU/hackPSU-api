import { Inject } from 'injection-js';
import {
  IProjectCategoryApiModel,
  ProjectCategory,
} from '../../models/project-category/project-category';
import { ProjectCategoryFactory } from '../../models/project-category/project-category-factory';
import { IApiReadable, IApiWritable, IDataMapper, IDbResult } from '../../services/database';
import { BaseProcessor } from '../base-processor';

export class ProjectCategoryProcessor extends BaseProcessor<ProjectCategory> {
  public apiReader: IApiReadable<ProjectCategory>;
  public apiWriter: IApiWritable<ProjectCategory>;

  constructor(@Inject('ProjectCategoryDataMapperImpl') public dataMapper: IDataMapper<ProjectCategory>) {
    super();
    this.apiReader = new ProjectCategoryFactory();
    this.apiWriter = new ProjectCategoryFactory();
  }

  public async addData(object: IProjectCategoryApiModel): Promise<IDbResult<IProjectCategoryApiModel>> {
    return super.addData(object) as Promise<IDbResult<IProjectCategoryApiModel>>;
  }
}
