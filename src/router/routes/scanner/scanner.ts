import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../js-common/errors';
import { Util } from '../../../js-common/util';
import { IAdminStatisticsDataMapper, IUserStatistics } from '../../../models/admin/statistics';
import { IActiveHackathonDataMapper } from '../../../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../models/register';
import { IScannerDataMapper } from '../../../models/scanner';
import { IScannerProcessor } from '../../../processors/scanner-processor';
import { IApikeyAuthService, IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDbResult } from '../../../services/database';
import { AbstractScannerController } from './scanner-controller-abstract';

@Injectable()
export class ScannerController extends AbstractScannerController implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAdminStatisticsDataMapper') private readonly adminStatisticsDataMapper: IAdminStatisticsDataMapper,
    @Inject('IAdminScannerProcessor') private readonly scannerProcessor: IScannerProcessor,
    @Inject('IActiveHackathonDataMapper') activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IAuthService') authService: IFirebaseAuthService,
    @Inject('IScannerAuthService') scannerAuthService: IApikeyAuthService,
    @Inject('IScannerDataMapper') scannerAcl: IAclPerm,
    @Inject('IScannerDataMapper') scannerDataMapper: IScannerDataMapper,
    @Inject('IRegisterDataMapper') registerDataMapper: IRegisterDataMapper,
  ) {
    super(
      authService,
      scannerAuthService,
      scannerAcl,
      scannerDataMapper,
      registerDataMapper,
      activeHackathonDataMapper,
    );
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.post(
      '/assign',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.CREATE),
      (req, res, next) => this.addRfidAssignments(req, res, next),
    ).post(
      '/register',
      (req, res, next) => this.confirmRegisterScannerHandler(req, res, next),
    ).get(
      '/register',
      (req, res, next) => this.authService.authenticationMiddleware(req, res, next),
      this.authService.verifyAcl(this.scannerAcl, AclOperations.CREATE),
      (req, res, next) => this.registerNewScannerHandler(res, next),
    ).post(
      '/scan',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.CREATE),
      (req, res, next) => this.addScans(req, res, next),
    ).get(
      '/events',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getNextEventsHandler(req, res, next),
    ).get(
      '/hackers',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getAllRegistrationsHandler(res, next),
    ).get(
      '/user',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getUserByRfidBand(req, res, next),
      (req, res, next) => this.getUserByRfidBandHandler(req, res, next),
    ).get(
      '/pin',
      (req, res, next) => this.verifyScannerPermissionsMiddleware(req, res, next, AclOperations.READ_ALL),
      (req, res, next) => this.getUserByCurrentPin(req, res, next),
    );
  }

  /**
   * @api {get} /scanner/register Start a scanner registration
   * @apiVersion 2.0.0
   * @apiName Start a scanner registration
   * @apiDescription NOTE: This method is rate-limited to 200 rpm
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiSuccess {PinToken} Pin Token containing temporary authentication pin, validity, and other metadata
   * @apiUse ResponseBodyDescription
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async registerNewScannerHandler(
    response: Response,
    next: NextFunction,
  ) {
    try {
      const pinToken = await this.scannerAuthService.generatePinAuthenticator();
      return this.sendResponse(
        response,
        new ResponseBody('Success', 200, { result: 'Success', data: pinToken }),
      );
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /scanner/assign Assign RFID tags ID to users
   * @apiVersion 2.0.0
   * @apiName Assign an RFID to a user
   *
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse ApiKeyArgumentRequired
   * @apiUse AuthArgumentRequired
   * @apiParam {Array} assignments An array or single instance of RFID tags to User uid assignments
   * @apiParamExample {json} Request-Example:
   *     {
   *       "assignments": [
   *        {
   *         "wid": "1vyv2boy1v3b4oi12-1234lhb1234b",
   *         "uid": "nbG7b87NB87nB7n98Y7",
   *         "time": 1239712938120
   *       },
   *       { ... }
   *       ]
   *     }
   * @apiSuccess {RfidAssignment[]} Array of rfid insertion results
   * @apiUse ResponseBodyDescription
   * @apiUse IllegalArgumentError
   */
  private async addRfidAssignments(req: Request, res: Response, next: NextFunction) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.assignments) {
      return Util.standardErrorHandler(
        new HttpError('Cannot find assignment(s) to add', 400),
        next,
      );
    }

    try {
      const response = await this.scannerProcessor.processRfidAssignments(req.body.assignments);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /scanner/scans Upload scans from the event
   * @apiVersion 2.0.0
   * @apiName Submit scans from the event
   *
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiParam {Array} scans An array of scan objects
   * @apiParamExample {json} Request-Example:
   *     {
   *       "scans": [
   *        {
   *         "wid": "1vyv2boy1v3b4oi12-1234lhb1234b",
   *         "scan_event": "nbG7b87NB87nB7n98Y7",
   *         "scan_time": 1239712938120
   *        },
   *        { ... }
   *     ]
   *   }
   * @apiSuccess {Scans[]} Array of scan insertion results
   * @apiUse ResponseBodyDescription
   * @apiUse IllegalArgumentError
   */
  private async addScans(req: Request, res: Response, next: NextFunction) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.scans) {
      return Util.standardErrorHandler(
        new HttpError('Cannot find scans(s) to add', 400),
        next,
      );
    }

    try {
      const response = await this.scannerProcessor.processScans(req.body.scans);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }
  }

  /**
   * @api {post} /scanner/register Confirm a scanner registration
   * @apiVersion 2.0.0
   * @apiName Confirm a scanner registration
   *
   * @apiGroup Admin Scanner
   * @apiParam pin {number} A pin generated by calling the GET: /register route
   * @apiSuccess {ApiToken} API Token containing api key, validity, and other metadata
   * @apiUse ResponseBodyDescription
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async confirmRegisterScannerHandler(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!request.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!request.body.pin || !parseInt(request.body.pin, 10)) {
      return Util.standardErrorHandler(
        new HttpError('could not find authentication pin', 400),
        next,
      );
    }
    if (!request.headers.macaddr) {
      return Util.standardErrorHandler(
        new HttpError('could not find mac address of device', 400),
        next,
      );
    }
    try {
      const res = await this.scannerProcessor.processorScannerConfirmation(
        parseInt(request.body.pin, 10),
        request.headers.macaddr as string,
      );
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.standardErrorHandler(error, next);
    }

  }

  /**
   * @api {get} /scanner/hackers Obtain all registrations
   * @apiVersion 2.0.0
   * @apiName Obtain all registrations (Scanner)
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Registration[]} Array of current registrations
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getAllRegistrationsHandler(res: Response, next: NextFunction) {
    let result: IDbResult<IUserStatistics[]>;
    try {
      result = await this.adminStatisticsDataMapper.getAllUserData({
        byHackathon: true,
        ignoreCache: true,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/scanner/user Obtain user by rfid band
   * @apiVersion 2.0.0
   * @apiName Obtain user information from Rid band (Scanner)
   *
   * @apiGroup Admin
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Any} user info
   * @apiUse IllegalArgumentError
   */
  private async getUserByRfidBandHandler(req: Request, res: Response, next: NextFunction) {
    if (!res.locals.registration) {
      return Util.standardErrorHandler(new HttpError('Invalid rfid band', 400), next);
    }
    try {
      const response = new ResponseBody('Success', 200, { result: 'Success',
        data: res.locals.registration,
      });
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /scanner/events Obtain relevant events
   * @apiVersion 2.0.0
   * @apiName Obtain all relevant events (Scanner)
   * @apiParam [filter] {boolean} whether to filter for relevant events or return all
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Event[]} Array of current events
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getNextEventsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.scannerProcessor.getRelevantEvents(req.query.filter);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /scanner/pin Get a user's registration by their pin
   * @apiVersion 2.0.0
   * @apiName Get User by Pin (Scanner)
   * @apiParam pin {number} current pin for the registration
   * @apiGroup Admin Scanner
   * @apiPermission TeamMemberPermission
   * @apiPermission ScannerPermission
   * @apiUse AuthArgumentRequired
   * @apiUse ApiKeyArgumentRequired
   * @apiSuccess {Registration} The relevant registration for the provided pin
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async getUserByCurrentPin(req: Request, res: Response, next: NextFunction) {
    if (!req.query.pin || !parseInt(req.query.pin, 10)) {
      return Util.standardErrorHandler(
        new HttpError('could not find pin to query by', 400),
        next,
      );
    }
    try {
      const response = await this.scannerProcessor.getUserByCurrentPin(
        parseInt(req.query.pin, 10),
      );
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
