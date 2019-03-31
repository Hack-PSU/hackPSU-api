import { EpochNumber, UidType } from '../../../js-common/common-types';
import BaseObject from '../../BaseObject';

export class EmailHistory extends BaseObject {
  public get id() {
    return null;
  }

  protected get schema(): any {
    return null;
  }

  constructor(
    public readonly sender: UidType,
    public readonly recipient: string,
    public readonly email_content: string,
    public readonly subject: string,
    public readonly recipient_name: string,
    public readonly time: EpochNumber,
    public readonly status: string,
    public readonly error?: Error,
  ) {
    super();
    this.disallowedProperties = ['error'];
  }

}
