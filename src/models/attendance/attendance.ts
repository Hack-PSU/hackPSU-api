/* eslint-disable class-methods-use-this */
import { EpochNumber, UidType } from '../../js-common/common-types';
import BaseObject from '../BaseObject';
import { EventType } from '../event/event';

export const TABLE_NAME = 'ATTENDANCE';

/**
 * TODO: Add documentation
 */
export class Attendance extends BaseObject {
  public idSCANS: number;
  public scan_location: number;
  public scan_time: EpochNumber;
  public user_uid: UidType;
  public location_name: string;
  public event_uid: UidType;
  public event_start_time: EpochNumber;
  public event_end_time: EpochNumber;
  public event_title: string;
  public event_description: string;
  public event_type: EventType;
  public hackathon_id: UidType;
  public hackathon_name: string;
  public hackathon_start_time: EpochNumber;
  public hackathon_end_time: EpochNumber;
  public hackathon_base_pin: number;
  public hackathon_active: boolean;

  public get schema() {
    return null;
  }
  public get id() {
    return this.idSCANS;
  }
  constructor(data) {
    super();
  }
}
