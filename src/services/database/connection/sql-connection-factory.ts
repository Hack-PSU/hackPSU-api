import { Injectable } from 'injection-js';
import { createPool, Pool, PoolConnection } from 'mysql';
import { Constants } from '../../../assets/constants/constants';
import { Util } from '../../../js-common/util';
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
    return new Promise<PoolConnection>(((resolve, reject) => {
      this.dbConnection.getConnection((err, connection) => {
        if (err) return reject(err);
        return resolve(connection);
      });
    }));
  }
}
