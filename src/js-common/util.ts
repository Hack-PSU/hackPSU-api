import * as Stringify from 'streaming-json-stringify';
import { RootInjector } from '../services/common/injector/root-injector';
import { HttpError } from './errors';

export class Util {
  public static readEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  public static getCurrentEnv(): Environment {
    switch (this.readEnv('APP_ENV', '')) {
      case 'PROD': case 'prod':
        return Environment.PRODUCTION;
      case 'STAGING': case 'staging':
        return Environment.STAGING;
      case 'TEST': case 'test':
        return Environment.TEST;
      case 'DEBUG': case 'debug':
        return Environment.DEBUG;
      default:
        throw new Error(`Invalid environment variable read: ${this.readEnv('APP_ENV', '')}`);
    }
  }

  public static errorHandler500(err, handler) {
    this.standardErrorHandler(err, handler);
  }

  public static standardErrorHandler(err, handler) {
    const error = new HttpError(err.message || err, err.status || 500);
    handler(error);
  }

  public static streamHandler(stream, res, next) {
    stream.pipe(Stringify())
      .pipe(res.type('json').status(200))
      .on('end', res.end)
      .on('error', err => Util.errorHandler500(err, next));
  }

  /**
   * Normalize a port into a number, string, or false.
   * @param val {number | string} The port
   * @return {string | number | boolean}
   */
  public static normalizePort(val: string) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return false;
  }

  /**
   * Returns an instance from the Dependency Framework of the
   * requested type.
   */
  public static getInstance(token: string) {
    return RootInjector.getInjector().get(token);
  }
}

export enum Environment {
  STAGING,
  TEST,
  PRODUCTION,
  DEBUG,
}
