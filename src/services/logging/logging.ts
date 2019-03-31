// tslint:disable:no-var-requires
import * as bunyan from 'bunyan';
import devNull from 'dev-null';
import { Request } from 'express';
import { Injectable } from 'injection-js';
import 'reflect-metadata';
import * as requestContext from 'request-context';
import { Util } from '../../js-common/util';
const { express } = require('@google-cloud/logging-bunyan');

const LOGGER_NAME = 'hackpsu-api';

@Injectable()
export class Logger {

  public bunyan: bunyan;
  private request?: any;

  constructor() {
    switch (process.env.APP_ENV) {
      case 'TEST':
      case 'test':
        this.bunyan = bunyan.createLogger({
          name: LOGGER_NAME,
          streams: [
            // stdout logging
            { stream: devNull(), level: 'debug' },
          ],
        });
        break;
      default:
        this.bunyan = bunyan.createLogger({
          name: LOGGER_NAME,
          streams: [
            // stdout logging
            { stream: process.stdout, level: 'info' },
            { stream: process.stderr, level: 'error' },
          ],
        });
    }
  }

  public async mw() {
    const { mw } = await express.middleware({
      level: 'trace',
      logName: LOGGER_NAME,
      serviceContext: {
        service: Util.readEnv('GAE_SERVICE', 'no-service'),
        version: Util.readEnv('GAE_VERSION', 'no-version'),
      },
    });
    return mw;
  }

  public setContext(request: Request) {
    this.request = request;
  }

  public debug(...message: any) {
    const request = requestContext.get('request:logger');
    if (request) {
      request.log.debug(...message);
    }
    this.bunyan.debug(message);
  }

  public info(...message: any) {
    const request = requestContext.get('request:logger');
    if (request) {
      request.log.info(...message);
    }
    this.bunyan.info(message);
  }

  public error(...message: any) {
    const request = requestContext.get('request:logger');
    if (request) {
      request.log.error(...message);
    }
    this.bunyan.error(message);
  }

  public warn(...message: any) {
    const request = requestContext.get('request:logger');
    if (request) {
      request.log.warn(...message);
    }
    this.bunyan.warn(message);
  }
}
