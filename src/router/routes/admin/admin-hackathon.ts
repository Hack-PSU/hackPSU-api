import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../js-common/errors';
import { Util } from '../../../js-common/util';
import { Hackathon } from '../../../models/hackathon';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm, IAdminAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminHackathonController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IActiveHackathonDataMapper') private readonly adminHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly acl: IAclPerm,
    @Inject('IAdminDataMapper') private readonly adminAcl: IAdminAclPerm,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.get(
      '/',
      this.authService.verifyAcl(this.acl, AclOperations.READ_ALL),
      (req, res, next) => this.getAllHackathonHandler(res, next),
    );
    app.get(
      '/count',
      this.authService.verifyAcl(this.acl, AclOperations.COUNT),
      (req, res, next) => this.countHackathonHandler(res, next),
    );
    app.post(
      '/',
      this.authService.verifyAcl(this.acl, AclOperations.CREATE),
      (req, res, next) => this.createHackathonHandler(req, res, next),
    );
    app.put(
      '/active',
      this.authService.verifyAcl(this.adminAcl, AclOperations.MAKE_ACTIVE),
      (req, res, next) => this.makeHackathonActiveHandler(req, res, next),
    );
    app.put(
      '/',
      this.authService.verifyAcl(this.acl, AclOperations.UPDATE),
      (req, res, next) => this.updateHackathonHandler(req, res, next),
    );
  }

  /**
   * @api {post} /admin/hackathon Add a new non-active hackathon
   * @apiVersion 2.0.0
   * @apiName Add new hackathon
   * @apiGroup Admin Hackathon
   * @apiPermission DirectorPermission
   * @apiParam {string} name The name of the new hackathon
   * @apiParam {number} startTime Epoch time for when the hackathon starts
   * @apiParam {number} endTime Epoch time for when the hackathon ends
   *
   * @apiUse AuthArgumentRequired
   * @apiUse ResponseBodyDescription
   *
   * @apiSuccess (200) {Hackathon} The inserted hackathon
   */
  private async createHackathonHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.name) {
      return Util.standardErrorHandler(
        new HttpError('Could not find name of new hackathon', 400),
        next,
      );
    }
    if (!req.body.startTime) {
      return Util.standardErrorHandler(
        new HttpError('Could not find start time of hackathon', 400),
        next,
      );
    }
    req.body.startTime = parseInt(req.body.startTime, 10);

    if (req.body.basePin) {
      req.body.basePin = parseInt(req.body.basePin, 10);
    }
    let hackathon: Hackathon;
    try {
      hackathon = new Hackathon(req.body);
    } catch (error) {
      return Util.standardErrorHandler(
        error,
        next,
      );
    }

    try {
      const result = await this.adminHackathonDataMapper.insert(hackathon);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {put} /admin/hackathon/active Mark a hackathon as active
   * @apiVersion 2.0.0
   * @apiDescription Ends the currently active hackathon and marks the provided hackathon as active
   * @apiName Add Active hackathon
   * @apiGroup Admin Hackathon
   * @apiPermission DirectorPermission
   * @apiParam {string} uid ID of the hackathon entry to mark active
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess (200) {Hackathon} Newly "activated" hackathon
   * @apiUse ResponseBodyDescription
   */
  private async makeHackathonActiveHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid) {
      return Util.standardErrorHandler(
        new HttpError('Could not find ID of hackathon', 400),
        next,
      );
    }

    try {
      const result = await this.adminHackathonDataMapper.makeActive(req.body.uid);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {put} /admin/hackathon/ Update non-active hackathon
   * @apiVersion 2.0.0
   * @apiName Update hackathon
   * @apiGroup Hackathon
   * @apiPermission DirectorPermission
   * @apiParam {string} name The name of the new hackathon
   * @apiParam {number} startTime Epoch time for when the hackathon starts
   * @apiParam {number} endTime Epoch time for when the hackathon ends
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess (200) {Hackathon} The updated hackathon
   * @apiUse ResponseBodyDescription
   */
  private async updateHackathonHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find ID of hackathon', 400), next);
    }

    let hackathon: Hackathon;
    try {
      hackathon = new Hackathon(req.body);
    } catch (error) {
      return Util.standardErrorHandler(
        error,
        next,
      );
    }

    try {
      const result = await this.adminHackathonDataMapper.update(hackathon);
      const response = new ResponseBody(
        'Success',
        200,
        result,
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {get} /admin/hackathon Get all hackathons
   * @apiVersion 2.0.0
   * @apiName Get Hackathons
   * @apiGroup Admin Hackathon
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Hackathon[]} Array of hackathons
   * @apiUse ResponseBodyDescription
   */
  private async getAllHackathonHandler(
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await this.adminHackathonDataMapper.getAll({
        count: res.locals.limit,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/hackathon/count Get a count of hackathons
   * @apiVersion 2.0.0
   * @apiName get count of hackathon
   * @apiGroup Admin Hackathon
   * @apiPermission TeamMemberPermission
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {number} the number of hackathons
   * @apiUse ResponseBodyDescription
   */
  private async countHackathonHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.adminHackathonDataMapper.getCount();
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
