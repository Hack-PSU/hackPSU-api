import {
  IApiModel,
  IApiReadable,
  IApiWritable,
  IDbReadable,
  IDbWritable,
} from '../services/database';
import BaseObject from './BaseObject';

export abstract class ObjectFactory<T extends BaseObject>
  implements IDbReadable<T>, IDbWritable<T>, IApiReadable<T>, IApiWritable<T> {
  public abstract generateApiRepresentation(data: T): IApiModel<T>;

  public abstract generateDbRepresentation(data: T): any;

  public abstract generateFromApi(data: IApiModel<T>): T;

  public abstract generateFromDbRepresentation(data: any): T;
}
