import fs from 'fs';
import {
  Connection,
  ConnectionConfig,
  ConnectionOptions,
  MysqlError,
  PoolConnection, Query, queryCallback,
  QueryFunction,
  QueryOptions,
} from 'mysql';
import path from 'path';
import { logger } from '../../logging/logging';

export class MockConnection implements PoolConnection {

  /**
   *
   * @param query
   * @param params
   * @param callback
   * @return {Promise<MockStream>}
   */
  public query: QueryFunction;

  public config: ConnectionConfig;
  public createQuery: QueryFunction;
  public state: 'connected' | 'authenticated' | 'disconnected' | 'protocol_error' | string;
  public threadId: number | null;

  constructor() {
    const qfn = (query: string, params: any, callback?: queryCallback): Query | undefined => {
      logger.info(`Query: ${query}\n Params: ${JSON.stringify(params)}`);
      this.noop();
      if (callback) {
        callback(
          null,
          Array.of(fs.readFileSync(path.join(__dirname, './dump_text'), 'utf-8')),
        );
      }
      return undefined;
    };
    this.query = qfn as QueryFunction;
  }

  /**
   *
   * @return {Promise<any>}
   */
  public beginTransaction(callback: any) {
    logger.info('Starting transaction');
    this.noop();
    callback();
  }

  /**
   *
   * @return {Promise<any>}
   */
  public rollback(callback: any) {
    logger.error('Rolling back');
    this.noop();
    callback();
  }

  public release() {
    logger.info('Connection released');
    this.noop();
  }

  public commit(callback: any) {
    logger.info('Query committed.');
    this.noop();
    if (callback) {
      callback();
    }
  }

  public changeUser(options: ConnectionOptions, callback?: (err: MysqlError) => void): void;
  public changeUser(callback: (err: MysqlError) => void): void;
  public changeUser(
    options: ConnectionOptions | ((err: MysqlError) => void),
    callback?: (err: MysqlError) => void,
  ): void {
    this.noop();
  }

  public connect(callback?: (err: MysqlError, ...args: any[]) => void): void;
  public connect(options: any, callback?: (err: MysqlError, ...args: any[]) => void): void;
  public connect(
    callback?: ((err: MysqlError, ...args: any[]) => void) | any,
    callback1?: (err: MysqlError, ...args: any[]) => void,
  ): void {
    this.noop();
  }

  public destroy(): void {
    this.noop();
  }

  public end(callback?: (err: MysqlError, ...args: any[]) => void): void;
  public end(options: any, callback: (err: MysqlError, ...args: any[]) => void): void;
  public end(
    callback?: ((err: MysqlError, ...args: any[]) => void) | any,
    callback1?: (err: MysqlError, ...args: any[]) => void,
  ): void {
    this.noop();
  }

  public escape(value: any, stringifyObjects?: boolean, timeZone?: string): string {
    return '';
  }

  public escapeId(value: string, forbidQualified?: boolean): string {
    return '';
  }

  public format(sql: string, values: any[], stringifyObjects?: boolean, timeZone?: string): string {
    return '';
  }

  public on(ev: 'drain' | 'connect', callback: () => void): Connection;
  public on(ev: 'end', callback: (err?: MysqlError) => void): Connection;
  public on(ev: 'fields', callback: (fields: any[]) => void): Connection;
  public on(ev: 'error', callback: (err: MysqlError) => void): Connection;
  public on(ev: 'enqueue', callback: (...args: any[]) => void): Connection;
  public on(ev: string, callback: (...args: any[]) => void): this;
  public on(
    ev: 'drain' | 'connect' | 'end' | 'fields' | 'error' | 'enqueue' | string,
    callback: (() => void) | ((err?: MysqlError) => void) |
      ((fields: any[]) => void) | ((err: MysqlError) => void) | ((...args: any[]) => void),
  ): Connection | this | undefined {
    return undefined;
  }

  public pause(): void {
    this.noop();
  }

  public ping(options?: QueryOptions, callback?: (err: MysqlError) => void): void;
  public ping(callback: (err: MysqlError) => void): void;
  public ping(
    options?: QueryOptions | ((err: MysqlError) => void),
    callback?: (err: MysqlError) => void,
  ): void {
    this.noop();
  }

  public resume(): void {
    this.noop();
  }

  public statistics(options?: QueryOptions, callback?: (err: MysqlError) => void): void;
  public statistics(callback: (err: MysqlError) => void): void;
  public statistics(
    options?: QueryOptions | ((err: MysqlError) => void),
    callback?: (err: MysqlError) => void,
  ): void {
    this.noop();
  }

  private noop() {
    return this;
  }
}
