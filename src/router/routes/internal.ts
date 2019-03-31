import express, { NextFunction, Request, Response } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '..';
import { HttpError } from '../../js-common/errors';
import { IAcl } from '../../services/auth/RBAC/rbac-types';
import { Logger } from '../../services/logging/logging';
import { ParentRouter } from '../router-types';

// const Metrics = require('../../services/logging/monitoring');

@Injectable()
export class InternalController extends ParentRouter implements IExpressController {
  protected static baseRoute = 'internal/';
  private static internalVerifier(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    if (!request.headers['x-appengine-cron']) {
      const error = new HttpError('You cannot call internal URLs', 401);
      return next(error);
    }
    return next();
  }

  public router: express.Router;

  constructor(
    @Inject('IAcl') protected readonly acl: IAcl,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    app.use((req, res, next) => InternalController.internalVerifier(req, res, next));
    app.get('/rbac', (req, res) => this.rbacDebug(res));
  }

  private rbacDebug(res: Response) {
    this.acl.printDebugInformation(this.logger);
    return this.sendResponse(
      res,
      new ResponseBody('Success', 200, { result: 'Success', data: 'printed debug information' }),
    );
  }
}
