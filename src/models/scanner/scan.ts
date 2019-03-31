import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { EpochNumber, UidType } from '../../js-common/common-types';
import BaseObject from '../BaseObject';
const rfidAssignmentSchema = jsonAssetLoader('rfidScansSchema');

interface IRfidScanApiModel {
  wid: UidType;
  scan_event: UidType;
  scan_time: EpochNumber;
  hackathon?: UidType;
}

export class Scan extends BaseObject {
  public readonly rfid_uid: UidType;
  public readonly scan_event: UidType;
  public readonly scan_time: EpochNumber;
  public readonly hackathon: UidType | undefined;

  public get id() {
    return this.rfid_uid;
  }

  protected get schema(): any {
    return rfidAssignmentSchema;
  }

  constructor(data: IRfidScanApiModel) {
    super();
    this.rfid_uid = data.wid;
    this.scan_event = data.scan_event;
    this.scan_time = data.scan_time;
    this.hackathon = data.hackathon;
  }

  public get cleanRepresentation() {
    const repr: any = super.cleanRepresentation;
    repr.wid = repr.rfid_uid;
    delete repr.rfid_uid;
    return repr as this;
  }
}
