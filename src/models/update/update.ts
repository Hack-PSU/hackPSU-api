/* eslint-disable class-methods-use-this */
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { EpochNumber } from '../../js-common/common-types';
import BaseObject from '../BaseObject';

const liveUpdateSchema = jsonAssetLoader('liveUpdateSchema');

interface IUpdateApiModel {
  updateTitle: string;
  updateText: string;
  updateImage?: string;
  updateTime: EpochNumber;
  pushNotification: boolean;
}

export class Update extends BaseObject {

  static get useRTDB() {
    return true;
  }

  get schema() {
    return liveUpdateSchema;
  }

  public get id() {
    return this.uid;
  }

  public static generateTestData() {
    throw new Error('Not implemented');
  }

  public update_title: string;
  public update_text: string;
  public update_image?: string;
  public update_time: number;
  public push_notification: boolean;
  public uid: string;

  constructor(data: IUpdateApiModel) {
    super();
    this.update_title = data.updateTitle;
    this.update_text = data.updateText;
    this.update_image = data.updateImage;
    this.update_time = data.updateTime || new Date().getTime();
    this.push_notification = data.pushNotification || false;
    this.disallowedProperties = ['useRTDB', 'push_notification', 'hackathonPromise'];
  }
}
