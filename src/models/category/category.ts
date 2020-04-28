// tslint:disable:import-name
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import BaseObject from '../BaseObject';

const categorySchema = jsonAssetLoader('categorySchema');

export const TABLE_NAME = 'CATEGORY_LIST';

export class Category extends BaseObject {

  public uid: number;
  private categoryName: string;
  private isSponsor: boolean;

  public get schema() {
    return categorySchema;
  }
  public get id() {
    return this.uid;
  }

  public constructor() {
    super();
  }

  public setUid(uid: number) {
    this.uid = uid;
    return this;
  }

  public setCategoryName(name: string) {
    this.categoryName = name;
    return this;
  }

  public setIsSponsor(isSponsor: boolean) {
    this.isSponsor = isSponsor;
    return this;
  }

  public getUid() {
    return this.uid;
  }

  public getCategoryName() {
    return this.categoryName;
  }

  public getIsSponsor() {
    return this.isSponsor;
  }
}

