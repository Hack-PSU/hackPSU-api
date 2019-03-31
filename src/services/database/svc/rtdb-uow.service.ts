import * as firebase from 'firebase-admin';
import { Inject, Injectable } from 'injection-js';
import { Environment, Util } from '../../../js-common/util';
import { Logger } from '../../logging/logging';
import { IRtdbFactory } from '../connection/rtdb-factory';
import { IUow } from './uow.service';

export enum RtdbQueryType {
  COUNT,
  DELETE,
  GET,
  REF,
  SET,
  UPDATE,
}

@Injectable()
export class RtdbUow implements IUow {
  private db: firebase.database.Database;

  constructor(
    @Inject('IRtdbFactory') private databaseFactory: IRtdbFactory,
    @Inject('BunyanLogger') private logger: Logger,
  ) {
    this.db = databaseFactory.getDatabase();
  }

  /**
   *
   * @param query {enum} GET, SET, REF
   * @param reference {String} A reference in the database
   * @param [data] {Object} Data if query is SET
   * @returns {Promise<DataSnapshot>}
   */
  public query<T>(query: RtdbQueryType, reference: string[], data?: any): Promise<T | T[]> {
    if (Util.getCurrentEnv() === Environment.DEBUG) {
      this.logger.info({ query, reference, data });
    }
    this.db.goOnline();
    switch (query) {
      case RtdbQueryType.GET:
        return this._get<T>(reference[0]);
      case RtdbQueryType.SET:
        return this._set<T>(data, reference[0]);
      case RtdbQueryType.REF:
        return Promise.resolve(this.db.ref(reference[0])
          .toString() as unknown as T);
      case RtdbQueryType.COUNT:
        return this._count<T>(reference[0]);
      case RtdbQueryType.UPDATE:
        return this._set<T>(data, reference[0]);
      default:
        return Promise.reject(new Error('Illegal query'));
    }
  }

  public _get<T>(reference) {
    return new Promise<T[]>((resolve, reject) => {
      this.db.ref(reference)
        .once('value', (data) => {
          const firebaseData = data.val();
          let result: any = [];
          if (firebaseData) {
            result = Object
              .entries(firebaseData)
              .map((pair) => {
                const r = {};
                [, r[pair[0]]] = pair;
                return r;
              });
          }
          resolve(result);
        })
        .catch(reject);
    });
  }

  public _count<T>(reference) {
    return new Promise<T>((resolve) => {
      let count = 0;
      this.db.ref(reference)
        .on('child_added', () => {
          count += 1;
        });
      this.db.ref(reference)
        .once('value', () => {
          resolve(count as unknown as T);
        });
    });
  }

  public complete() {
    return Promise.resolve();
  }

  public _set<T>(data, reference) {
    return new Promise<T>((resolve, reject) => {
      if (!data) {
        reject(new Error('opts.data must be provided'));
        return;
      }
      this.db.ref(reference)
        .transaction(() => data, (error, committed, snapshot) => {
          if (error) {
            return reject(error);
          }
          if (!snapshot) {
            return reject(new Error('Could not write'));
          }
          const returnObject = {};
          returnObject[snapshot.key!] = snapshot.val();
          resolve(returnObject as T);
        },           true)
        .catch(reject);
    });
  }

  public commit(): Promise<any> {
    return Promise.resolve();
  }
}
