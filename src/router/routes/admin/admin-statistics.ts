import { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import { IExpressController, ResponseBody } from '../..';
import { HttpError } from '../../../js-common/errors';
import { Util } from '../../../js-common/util';
import {
  IAdminStatisticsDataMapper, IUserCount, IUserStatistics,
} from '../../../models/admin/statistics';
import { IAttendanceDataMapper } from '../../../models/attendance/attendance-data-mapper-impl';
import {
  IPreRegisterDataMapper,
  IRegisterDataMapper,
} from '../../../models/register';
import { IRegistrationStats } from '../../../models/register/registration';
import { Rsvp } from '../../../models/rsvp/rsvp';
import { IScannerDataMapper } from '../../../models/scanner';
import { IFirebaseAuthService } from '../../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapper, IDbResult } from '../../../services/database';
import { Logger } from '../../../services/logging/logging';
import { ParentRouter } from '../../router-types';

@Injectable()
export class AdminStatisticsController extends ParentRouter implements IExpressController {
  public router: Router;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IAdminStatisticsDataMapper') private readonly adminStatisticsDataMapper: IAdminStatisticsDataMapper,
    @Inject('IRsvpDataMapper') private readonly rsvpDataMapper: IDataMapper<Rsvp>,
    @Inject('IAdminStatisticsDataMapper') private readonly acl: IAclPerm,
    @Inject('IAttendanceDataMapper') private readonly attendanceDataMapper: IAttendanceDataMapper,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IPreRegisterDataMapper') private readonly preRegDataMapper: IPreRegisterDataMapper,
    @Inject('IScannerDataMapper') private readonly scannerDataMapper: IScannerDataMapper,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.router = Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    app.use(this.authService.verifyAcl(this.acl, AclOperations.READ));
    app.get(
      '/',
      (req, res, next) => this.getStatistics(req, res, next),
    );
  }

  /**
   * @api {get} /admin/data/?type=registration_stats Get all user data
   * @apiVersion 2.0.0
   * @apiName Get list of all users
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {Number} limit=Math.inf Limit to a certain number of responses
   * @apiParam {Number} offset=0 The offset to start retrieving users from. Useful for pagination
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {UserStatistics[]} Array of all users
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getRegistrationStatisticsHandler(res: Response, next: NextFunction) {
    let result: IDbResult<IUserStatistics[]>;
    try {
      result = await this.adminStatisticsDataMapper.getAllUserData({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
        ignoreCache: res.locals.ignoreCache,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/data/?type=registration_category_count Get the count of category data
   * @apiVersion 2.0.0
   * @apiName Get Registration Statistics Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {number[]} number of users that selected particular categories for registrations
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getRegistrationStatisticsCountHandler(
    res: Response,
    next: NextFunction,
  ) {
    let result: IDbResult<IRegistrationStats[]>;
    try {
      result = await this.registerDataMapper.getRegistrationStats({
        byHackathon: !res.locals.allHackathons,
        hackathon: res.locals.hackathon,
        ignoreCache: res.locals.ignoreCache,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/data/?type=stats_count Get number of users by interaction type (Pre registration, Registration, rsvp, Event scans)
   * @apiVersion 2.0.0
   * @apiName Get User Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {number[]} number of all users in each category (PreRegistration, Registration, rsvp, Scans)
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getUserCountByCategoryHandler(
    res: Response,
    next: NextFunction,
  ) {
    let result: IDbResult<IUserCount[]>;
    try {
      result = await this.adminStatisticsDataMapper.getUserCountByCategory({
        byHackathon: !res.locals.allHackathons,
        hackathon: res.locals.hackathon,
        ignoreCache: res.locals.ignoreCache,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/data/?type=preregistration_count Get a count of Preregistered Users
   * @apiVersion 2.0.0
   * @apiName get count preregistration
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {number} number of preregistered users
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getPreRegistrationCountHandler(res: Response, next: NextFunction) {
    let result: IDbResult<number>;
    try {
      result = await this.preRegDataMapper.getCount({
        byHackathon: !res.locals.allHackathons,
        hackathon: res.locals.hackathon,
      });
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
    const response = new ResponseBody('Success', 200, result);
    return this.sendResponse(res, response);
  }

  /**
   * @api {get} /admin/data/?type=preregistration Get all pre-registered users
   * @apiVersion 2.0.0
   * @apiName Get Pre-registration
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {PreRegistration[]} all preregistered users
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getPreRegistrationHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.preRegDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=scans Get all event scans
   * @apiVersion 2.0.0
   * @apiName Get Scans
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Scan[]} Array of Scans
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getScansHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.scannerDataMapper.getAllScans({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=wid_assignments Get all wristband assignments
   * @apiVersion 2.0.0
   * @apiName Get Wristband Assignments
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {RfidAssignment[]} Array of Wristband assignments
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getWidAssignments(res: Response, next: NextFunction) {
    try {
      const result = await this.scannerDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=rsvp Get all rsvp'ed users
   * @apiVersion 2.0.0
   * @apiName Get rsvp
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Rsvp[]} Array of Rsvp
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getRsvpHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.rsvpDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=rsvp_count Get number of rsvp'ed users
   * @apiVersion 2.0.0
   * @apiName Get rsvp Count
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {number} number of rsvp
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getRsvpCountHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.rsvpDataMapper.getCount({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=attendance Get all attendance data
   * @apiVersion 2.0.0
   * @apiName Get Attendance
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Attendance[]} All Attendance data
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getAttendanceHandler(res: Response, next: NextFunction) {
    try {
      const result = await this.attendanceDataMapper.getAll({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=attendance&aggregator=event Get all attendance data by event
   * @apiVersion 2.0.0
   * @apiName Get Attendance by event
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   * @apiParam [uid] {String} The uid of an event to filter by
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {EventUid-Registration[]} All Attendance data aggregated by event
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   * @apiUse RequestOpts
   */
  private async getAttendanceByEventHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.attendanceDataMapper.getAttendanceByEvent({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
        uid: req.query.uid,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /admin/data/?type=attendance&aggregator=user Get all attendance data by user
   * @apiVersion 2.0.0
   * @apiName Get Attendance by user
   * @apiGroup Admin Statistics
   * @apiPermission TeamMemberPermission
   * @apiParam [uid] {String} The uid of a user to filter by
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {UserUid-Event[]} All Attendance data aggregated by event
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getAttendanceByUserHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.attendanceDataMapper.getAttendanceByUser({
        byHackathon: !res.locals.allHackathons,
        count: res.locals.limit,
        hackathon: res.locals.hackathon,
        startAt: res.locals.offset,
        uid: req.query.uid,
        ignoreCache: res.locals.ignoreCache,
      });
      const response = new ResponseBody('Success', 200, result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * Handler that parses query type and routes to the appropriate handler
   */
  private getStatistics(req: Request, res: Response, next: NextFunction) {
    if (!req.query.type) {
      return Util.standardErrorHandler(
        new HttpError(
          'Type of required statistic must be provided in query',
          400,
        ),
        next,
      );
    }

    switch (req.query.type) {
      case 'stats_count':
        return this.getUserCountByCategoryHandler(res, next);
      case 'preregistration_count':
        return this.getPreRegistrationCountHandler(res, next);
      case 'preregistration':
        return this.getPreRegistrationHandler(res, next);
      case 'registration_category_count':
        return this.getRegistrationStatisticsCountHandler(res, next);
      case 'registration_stats':
        return this.getRegistrationStatisticsHandler(res, next);
      case 'rsvp':
        return this.getRsvpHandler(res, next);
      case 'scans':
        return this.getScansHandler(res, next);
      case 'wid_assignments':
        return this.getWidAssignments(res, next);
      case 'rsvp_count':
        return this.getRsvpCountHandler(res, next);
      case 'attendance':
        switch (req.query.aggregator) {
          case 'event':
            return this.getAttendanceByEventHandler(req, res, next);
          case 'user':
            return this.getAttendanceByUserHandler(req, res, next);
          default:
            return this.getAttendanceHandler(res, next);
        }
      default:
        return Util.standardErrorHandler(
          new HttpError(
            'provided statistics type is not supported',
            400,
          ),
          next,
        );
    }
  }
}
