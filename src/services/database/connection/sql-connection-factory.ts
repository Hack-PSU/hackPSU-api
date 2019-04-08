import { Injectable } from 'injection-js';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { Constants } from '../../../assets/constants/constants';
import { Util } from '../../../JSCommon/util';
import { IConnectionFactory } from './connection-factory';

@Injectable()
export class SqlConnectionFactory implements IConnectionFactory {
  private dbConnection: Pool;

  constructor() {
    if (Util.readEnv('INSTANCE_CONNECTION_NAME', '') !== '') {
      Constants.sqlConnection.host = '';
    } else {
      Constants.sqlConnection.socketPath = '';
    }
    this.dbConnection = createPool(Constants.sqlConnection);
  }

  public getConnection(): Promise<PoolConnection> {
    return this.dbConnection.getConnection();
  }
}
