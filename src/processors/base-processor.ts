import { UidType } from '../JSCommon/common-types';
import BaseObject from '../models/BaseObject';
import {
  IApiModel,
  IApiReadable,
  IApiWritable,
  IDataMapper,
  IDbResult,
} from '../services/database';
import { IUowOpts } from '../services/database/svc/uow.service';

export abstract class BaseProcessor<T extends BaseObject> {
  protected abstract dataMapper: IDataMapper<T>;
  protected abstract apiWriter: IApiWritable<T>;
  protected abstract apiReader: IApiReadable<T>;

  public async getData(uid: UidType | number, opts?: IUowOpts): Promise<IDbResult<IApiModel<T>>> {
    const result = await this.dataMapper.get(uid, opts);
    const apiRepr = this.apiWriter.generateApiRepresentation(result.data);
    return { result: 'Success', data: apiRepr };
  }

  public async getAllData(opts?: IUowOpts): Promise<IDbResult<Array<IApiModel<T>>>> {
    const result = await this.dataMapper.getAll(opts);
    const apiRepr = result.data.map(object => this.apiWriter.generateApiRepresentation(object));
    return { result: 'Success', data: apiRepr };
  }

  public async addData(object: IApiModel<T>): Promise<IDbResult<IApiModel<T>>> {
    const result = await this.dataMapper.insert(this.apiReader.generateFromApi(object));
    const apiRepr = this.apiWriter.generateApiRepresentation(result.data);
    return { result: 'Success', data: apiRepr };
  }

  public async updateData(object: IApiModel<T>): Promise<IDbResult<IApiModel<T>>> {
    if (!object.uid) {
      throw new Error('UID must be provided');
    }
    const { data: currentDbObject } = await this.dataMapper.get(object.uid, { ignoreCache: true });
    const mergedItem = currentDbObject.merge(this.apiReader.generateFromApi(object), currentDbObject);
    const result = await this.dataMapper.update(mergedItem);
    const apiRepr = this.apiWriter.generateApiRepresentation(result.data);
    return { result: 'Success', data: apiRepr };
  }

  public async deleteData(object: IApiModel<T>): Promise<IDbResult<void>> {
    const toDelete = this.apiReader.generateFromApi(object);
    return this.dataMapper.delete(toDelete);
  }
}
