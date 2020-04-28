import { Inject, Injectable } from 'injection-js';
import { Category } from '../models/category/category';
import { CategoryFactory } from '../models/category/category-factory';
import { IApiReadable, IApiWritable, IDataMapper } from '../services/database';
import { BaseProcessor } from './base-processor';

@Injectable()
export class CategoryProcessor extends BaseProcessor<Category> {
  protected apiReader: IApiReadable<Category>;
  protected apiWriter: IApiWritable<Category>;

  constructor(@Inject('CategoryDataMapperImpl') protected dataMapper: IDataMapper<Category>) {
    super();
    this.apiReader = new CategoryFactory();
    this.apiWriter = new CategoryFactory();
  }
}
