import * as uuid from 'uuid';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../js-common/common-types';
import BaseObject from '../BaseObject';

const eventSchema = jsonAssetLoader('eventSchema');

export enum EventType {
  WORKSHOP = 'workshop',
  ACTIVITY = 'activity',
  FOOD = 'food',
}

interface IEventApiModel {
  uid?: UidType;
  eventLocation: string;
  eventStartTime: number;
  eventEndTime: number;
  eventTitle: string;
  eventDescription?: string;
  eventType: EventType;
}

export class Event extends BaseObject {

  get schema() {
    return eventSchema;
  }

  public get id() {
    return this.uid;
  }

  public readonly uid: UidType;
  public event_location: string;
  public event_start_time: number;
  public event_end_time: number;
  public event_title: string;
  public event_description: string | null;
  public event_type: string;
  public hackathon?: UidType;

  constructor(data: IEventApiModel) {
    super();
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.event_location = data.eventLocation;
    this.event_start_time = data.eventStartTime;
    this.event_end_time = data.eventEndTime;
    this.event_title = data.eventTitle;
    this.event_description = data.eventDescription || null;
    this.event_type = data.eventType;
  }
}
