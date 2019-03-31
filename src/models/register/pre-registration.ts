import v4 from 'uuid/v4';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../js-common/common-types';
import BaseObject from '../BaseObject';

const preRegisteredSchema = jsonAssetLoader('preRegisteredSchema');

export class PreRegistration extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return preRegisteredSchema;
  }

  public readonly uid: UidType;
  public email: string;

  constructor(email: string, uid?: string) {
    super();
    this.email = email;
    this.uid = uid || v4().replace(/-/g, '');
  }
}
