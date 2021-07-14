// Setup cloud specific trace and debug
import * as debugAgent from '@google-cloud/debug-agent';
import * as traceAgent from '@google-cloud/trace-agent';
import { Environment, Util } from './JSCommon/util';
if (Util.getCurrentEnv() !== Environment.TEST) {
  traceAgent.start();
  debugAgent.start();
}
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { default as expressQueryBoolean } from 'express-query-boolean';
import helmet from 'helmet';
import * as path from 'path';
import * as requestContext from 'request-context';
import 'source-map-support/register';
import { HttpError } from './JSCommon/errors';
import { ParentRouter, ResponseBody } from './router/router-types';
import { ExpressProvider } from './services/common/injector/providers';
import { Logger } from './services/logging/logging';

ExpressProvider.config();

export class App extends ParentRouter {
  private static notFoundHandler(request, response, next: NextFunction) {
    next(new HttpError('Not Found', 404));
  }

  public app: express.Application;
  private logger: Logger = Util.getInstance('BunyanLogger');

  constructor() {
    super();
    this.app = express();
    this.config();
  }

  private errorHandler(error: HttpError, request: Request, response: Response, next: NextFunction) {
    if (Util.getCurrentEnv() !== Environment.TEST) {
      this.logger.error(error);
    }
    // set locals, only providing error in development
    response.locals.message = error.message;
    response.locals.error = Util.getCurrentEnv() !== Environment.PRODUCTION ? error : {};

    // render the error page
    response.status(error.status || 500);
    const res = new ResponseBody(
      'Error',
      error.status || 500,
      { result: 'Error', data: error.body },
    );
    this.sendResponse(response, res);
    next();
  }

  private config() {
    this.loggerConfig()
      .then(() => {
        // Set proxy settings
        this.app.set('trust proxy', true);

        // Setup CORS and other security options
        this.securityConfig();

        // Setup views
        this.viewConfig();

        // Setup body parser
        this.parserConfig();

        // Setup static files
        this.staticFileConfig();

        // Setup routers
        this.routerConfig();
      })
      .catch((error) => {
        // tslint:disable-next-line:no-console
        console.error(error);
      });
  }

  /**
   * Setup any static file handlers
   */
  private staticFileConfig() {
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  /**
   * Setup the configuration for any views that need to be served
   */
  private viewConfig() {
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'pug');
  }

  /**
   * Setup configuration to properly parse the body in requests
   */
  private parserConfig() {
    // Body parser
    this.app.use(bodyParser.json({
      limit: '10mb',
    }));
    // this.app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
    // Setup Cookie Parser
    this.app.use(cookieParser());

    // Setup boolean query parser
    this.app.use(expressQueryBoolean());
  }

  /**
   * Setup CORS and other security related configurations
   * NOTE: SSL is not configured through Express on purpose.
   * We expect that this server runs behind NGINX or some other proxy
   * that handles SSL
   */
  private securityConfig() {
    // WHITELIST: Allow any subdomain of hackpsu.org or hackpsu.com
    // For testing allow any domain starting with localhost:<PORT>
    const whitelist = /^((https:\/\/)?((.*)\.)?hackpsu.(com|org))|(http:\/\/localhost:?\d*)$/;
    const corsOptions = {
      origin: (origin, callback) => {       
        if (whitelist.test(origin) || Util.getCurrentEnv() !== Environment.PRODUCTION) {
          callback(null, true);
        } else {
          // Allow all requests if running on non-production environmennts
          //callback(null, false);
          callback(new Error("CORS DISALLOWED - Environment: " + Util.getCurrentEnv()));
        }
      },
    };
    this.app.use(cors(corsOptions));

    // Setup Helmet.js
    this.app.use(helmet());
    this.app.use(helmet.hidePoweredBy());
  }

  private routerConfig() {
    App.registerRouter('', 'IndexController', 2);
    App.registerRouter('live', 'LiveController', 2);
    App.registerRouter('internal', 'InternalController', 2);
    App.registerRouter('users', 'UsersController', 2);
    App.registerRouter('admin', 'AdminController', 2);
    App.registerRouter('scanner', 'ScannerController', 2);
    App.registeredRoutes.forEach((router, key) => {
      this.app.use(key, Util.getInstance(router).router);
    });
    this.app.use('', Util.getInstance('IndexController').router);
    this.app.use('/v2/doc', express.static(path.join(__dirname, 'doc')));

    // ERROR HANDLERS
    this.app.use(App.notFoundHandler);
    this.app.use((
      error: HttpError,
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      this.errorHandler(error, request, response, next);
    });
  }

  private async loggerConfig() {
    if (Util.getCurrentEnv() !== Environment.TEST && Util.getCurrentEnv() !== Environment.DEBUG) {
      const loggingMw = await this.logger.mw();
      this.app.use(requestContext.middleware('request'));
      this.app.use(loggingMw);
      this.app.use((request: Request, response, next) => {
        requestContext.set('request:logger', request);
        next();
      });
    }
    return;
  }
}

export default new App().app;
