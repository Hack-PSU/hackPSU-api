import { Inject, Injectable } from 'injection-js';
import { MysqlError, PoolConnection } from 'mysql';
import { defer, from, Observable } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { HttpError } from '../../../JSCommon/errors';
import { Logger } from '../../logging/logging';
import { ICacheService } from '../cache/cache';
import { IConnectionFactory } from '../connection/connection-factory';
import { IDbReadable } from '../index';
import { IQueryOpts, IUow } from './uow.service';

export enum SQL_ERRORS {
  DUPLICATE_KEY = 1062,
  PARSE_ERROR = 1064,
  SYNTAX_ERROR = 1149,
  NOT_FOUND = 404,
  FOREIGN_KEY_DELETE_FAILURE = 1217,
  FOREIGN_KEY_INSERT_FAILURE = 1452,
  BAD_NULL_ERROR = 1048,
  CONNECTION_REFUSED = 'ECONNREFUSED',
}

@Injectable()
export class MysqlUow implements IUow {

  private connectionPromise: Observable<PoolConnection>;

  /**
   *
   */
  constructor(
    @Inject('IConnectionFactory') private connectionFactory: IConnectionFactory,
    @Inject('ICacheService') private cacheService: ICacheService,
    @Inject('BunyanLogger') private logger: Logger,
  ) {
    this.connectionPromise = defer<PoolConnection>(() => this.connectionFactory.getConnection())
      .pipe(
        catchError((error) => {
          this.logger.error(error);
          throw error;
        }),
      );
  }

  /**
   * @param query The query string to query with.
   * This function performs SQL escaping, so any substitutable parameters should be '?'s
   * @param params Parameters to substitute in the query
   * @param dbReader Reader that converts database JSON to node objects
   * @return {Promise<any>}
   */
  public query<T>(
    query: string,
    params: Array<string | boolean | number> = [],
    dbReader?: IDbReadable<T>,
    opts: IQueryOpts = { cache: false },
  ) {
    return this.connectionPromise
      .pipe(
        mergeMap((connection: PoolConnection) => {
          return new Promise<T[]>(async (resolve, reject) => {
            if (opts.cache) { // Check cache
              try {
                const result: T[] = await this.cacheService.get(`${query}${(params as string[]).join('')}`);
                if (result !== null) {
                  this.release(connection);
                  this.logger.info('served request from memory cache');
                  return resolve(result);
                }
              } catch (err) {
                // Error checking cache. Fallback silently.
                this.logger.error(err);
              }
            }
            connection.beginTransaction(() => {
              connection.query(query, params, async (err: MysqlError, result: T[]) => {
                if (err) {
                  connection.rollback();
                  this.release(connection);
                  return reject(err);
                }
                if (result.length === 0) {
                  this.complete(connection);
                  return reject({
                    sql: connection.format(query, params),
                    code: 'no data found',
                    errno: 404,
                  });
                }
                // Add result to cache
                try {
                  await this.cacheService.set(`${query}${(params as string[]).join('')}`, result);
                } catch (error) {
                  this.logger.error(error);
                }
                this.complete(connection);
                return resolve(result);
              });
            });
          });
        }),
        catchError((err: MysqlError) => {
          this.sqlErrorHandler(err);
          return from([]);
        }),
        map((results: any[]) => dbReader ? results.map(result => dbReader.generateFromDbRepresentation(result)) : results),
      )
      .toPromise()
      // Gracefully convert MySQL errors to HTTP Errors
      .catch((err: MysqlError) => this.sqlErrorHandler(err));
  }

  public commit(connection: PoolConnection) {
    return new Promise<any>((resolve) => {
      connection.commit(() => {
        return resolve(null);
      });
    });
  }

  public complete(connection: PoolConnection) {
    return new Promise<any>((resolve) => {
      connection.commit(() => {
        this.release(connection);
        return resolve(null);
      });
    });
  }

  public release(connection: PoolConnection) {
    connection.release();
  }

  /**
   * Converts MySQL errors to HTTP Errors
   * @param {MysqlError} error
   */
  private sqlErrorHandler(error: MysqlError) {
    if (error instanceof HttpError) {
      // Error was already handled
      throw error;
    }
    this.logger.error(error);
    switch (error.errno) {
      case SQL_ERRORS.PARSE_ERROR:
      case SQL_ERRORS.SYNTAX_ERROR:
        throw new HttpError(
          'the mysql query was ill-formed', 500);
      case SQL_ERRORS.DUPLICATE_KEY:
        throw new HttpError(
          'duplicate objects not allowed', 409);
      case SQL_ERRORS.FOREIGN_KEY_INSERT_FAILURE:
        throw new HttpError(
          'object depends on non-existent dependency', 400);
      case SQL_ERRORS.FOREIGN_KEY_DELETE_FAILURE:
        throw new HttpError(
          'cannot delete as this object is referenced elsewhere', 400);
      case SQL_ERRORS.CONNECTION_REFUSED:
        throw new HttpError(
          'could not connect to the database', 500);
      case SQL_ERRORS.BAD_NULL_ERROR:
        throw new HttpError(
          'a required property was found to be null', 400,
        );
      case SQL_ERRORS.NOT_FOUND:
        throw new HttpError(
          'no data was found for this query', 404,
        );
    }
    // TODO: Handle other known SQL errors here
    throw error;
  }
}
