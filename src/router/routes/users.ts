import { validate } from 'email-validator';
import express, { NextFunction, Request, Response, Router } from 'express';
import { Inject, Injectable } from 'injection-js';
import * as path from 'path';
import { map } from 'rxjs/operators';
import { IExpressController } from '..';
import { Constants } from '../../assets/constants/constants';
import { UidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { Util } from '../../js-common/util';
import { IActiveHackathonDataMapper } from '../../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../models/register';
import { PreRegistration } from '../../models/register/pre-registration';
import { Registration } from '../../models/register/registration';
import { IPreregistrationProcessor } from '../../processors/pre-registration-processor';
import { IRegistrationProcessor } from '../../processors/registration-processor';
import { AuthLevel, IFirebaseAuthService } from '../../services/auth/auth-types';
import { AclOperations, IAclPerm } from '../../services/auth/RBAC/rbac-types';
import { Logger } from '../../services/logging/logging';
import { IStorageService } from '../../services/storage';
import { IStorageMapper } from '../../services/storage/svc/storage.service';
import { ParentRouter } from '../router-types';

@Injectable()
export class UsersController extends ParentRouter implements IExpressController {

  protected static baseRoute = '/users';

  public router: Router;

  private resumeUploader: IStorageMapper;

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IRegisterDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('IExtraCreditDataMapper') private readonly extraCreditPerm: IAclPerm,
    @Inject('IRegistrationProcessor') private readonly registrationProcessor: IRegistrationProcessor,
    @Inject('IPreregistrationProcessor') private readonly preregistrationProcessor: IPreregistrationProcessor,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IStorageService') private readonly storageService: IStorageService,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.resumeUploader = this.storageService.mapper({
      opts: {
        filename: (req) => {
          if (!req.body.uid || !req.body.firstName || !req.body.lastName) {
            throw new HttpError('Could not parse fields for resume upload', 400);
          }
          return this.generateFileName(req.body.uid, req.body.firstName, req.body.lastName);
        },
        bucket: Constants.GCS.resumeBucket,
        projectId: Constants.GCS.projectId,
        keyFilename: Constants.GCS.keyFile,
        metadata: {
          contentType: 'application/pdf',
          public: true,
          resumable: false,
          gzip: true,
        },
      },
      fieldName: 'resume',
      fileFilter: file => path.extname(file.originalname) === '.pdf',
      fileLimits: { maxNumFiles: 1 },
      multipleFiles: false,
    });
    this.router = express.Router();
    this.routes(this.router);
  }

  public routes(app: Router): void {
    // Unauthenticated routes
    app.post('/pre-register', (req, res, next) => this.preRegistrationHandler(req, res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app.post(
      '/register',
      this.authService.verifyAcl(this.aclPerm, AclOperations.CREATE),
      this.resumeUploader.upload(),
      (req, res, next) => this.validateRegistrationFieldsMiddleware(req, res, next),
      (req, res, next) => this.registrationHandler(req, res, next),
    );
    app.get(
      '/register',
      this.authService.verifyAcl(this.aclPerm, AclOperations.READ),
      (req, res, next) => this.getAllRegistrations(req, res, next),
    );
  }

  private async generateFileName(uid: UidType, firstName: string, lastName: string) {
    return `${uid}-${firstName}-${lastName}-${await this.activeHackathonDataMapper.activeHackathon.pipe(
      map(hackathon => hackathon.uid)).toPromise()}.pdf`;
  }

  private validateRegistrationFields(registration: any) {
    if (!registration) {
      this.logger.error('No registration provided');
      throw new HttpError('No registration provided', 400);
    }
    if (!validate(registration.email)) {
      this.logger.error('IEmail used for registration is invalid');
      throw new HttpError('IEmail used for registration is invalid', 400);
    }
    if (!registration.eighteenBeforeEvent) {
      this.logger.error('User must be over eighteen years of age to register');
      throw new HttpError('User must be over eighteen years of age to register', 400);
    }
    if (!registration.mlhcoc) {
      this.logger.error('User must agree to MLH Code of Conduct');
      throw new HttpError('User must agree to MLH Code of Conduct', 400);
    }
    if (!registration.mlhdcp) {
      this.logger.error('User must agree to MLH data collection policy');
      throw new HttpError('User must agree to MLH data collection policy', 400);
    }
  }

  /**
   * @api {post} /users/pre-register Preregister for HackPSU
   * @apiVersion 2.0.0
   * @apiName Add Pre-Registration
   * @apiGroup User
   * @apiParam {String} email The email ID to register with
   * @apiSuccess {PreRegistration} The inserted pre registration
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async preRegistrationHandler(request: Request, response: Response, next: NextFunction) {
    if (!request.body ||
      !request.body.email ||
      !validate(request.body.email)) {
      return next(new HttpError('Valid email must be provided', 400));
    }
    let preRegistration;
    try {
      preRegistration = new PreRegistration(request.body.email);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError('Some properties were not as expected', 400),
        next,
      );
    }
    try {
      const res = await this.preregistrationProcessor.processPreregistration(preRegistration);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  private validateRegistrationFieldsMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ) {
    // Validate incoming registration
    try {
      this.registrationProcessor.normaliseRegistrationData(request.body);
      request.body.uid = response.locals.user.uid;
      request.body.email = response.locals.user.email;
      this.validateRegistrationFields(request.body);
      return next();
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError(error.toString(), 400),
        next,
      );
    }
  }

  /**
   * @api {post} /users/register/ Register for HackPSU
   * @apiVersion 2.0.0
   * @apiName Add Registration
   * @apiGroup User
   * @apiPermission UserPermission
   * @apiUse AuthArgumentRequired
   * @apiHeader {String} content-type Must be x-www-form-urlencoded or multipart/form-data
   * @apiParam {String} firstName First name of the user
   * @apiParam {String} lastName Last name of the user
   * @apiParam {String} gender Gender of the user
   * @apiParam {enum} shirtSize [XS, S, M, L, XL, XXL]
   * @apiParam {String} [dietaryRestriction] The dietary restictions for the user
   * @apiParam {String} [allergies] Any allergies the user might have
   * @apiParam {boolean} travelReimbursement=false
   * @apiParam {boolean} firstHackathon=false Is this the user's first hackathon
   * @apiParam {String} university The university that the user attends
   * @apiParam {String} email The user's school email
   * @apiParam {String} academicYear The user's current year in school
   * @apiParam {String} major Intended or current major
   * @apiParam {String} phone The user's phone number (For MLH)
   * @apiParam {FILE} [resume] The resume file for the user (Max size: 10 MB)
   * @apiParam {String} [ethnicity] The user's ethnicity
   * @apiParam {String} codingExperience The coding experience that the user has
   * @apiParam {String} uid The UID from their Firebase account
   * @apiParam {boolean} eighteenBeforeEvent=true Will the person be eighteen before the event
   * @apiParam {boolean} mlhcoc=true Does the user agree to the mlhcoc?
   * @apiParam {boolean} mlhdcp=true Does the user agree to the mlh dcp?
   * @apiParam {String} referral Where did the user hear about the Hackathon?
   * @apiParam {String} project A project description that the user is proud of
   * @apiParam {String} expectations What the user expects to get from the hackathon
   * @apiParam {String} veteran=false Is the user a veteran?
   *
   * @apiSuccess {Registration} The inserted registration
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async registrationHandler(request: Request, response: Response, next: NextFunction) {
    // Save registration
    if (request.file) {
      request.body.resume = this.resumeUploader.uploadedFileUrl(
        await this.generateFileName(
          request.body.uid,
          request.body.firstName,
          request.body.lastName,
        ),
      );
    }

    let registration: Registration;
    try {
      registration = new Registration(request.body);
    } catch (error) {
      return Util.standardErrorHandler(
        new HttpError('Some properties were not as expected', 400),
        next,
      );
    }
    try {
      const res = await this.registrationProcessor.processRegistration(registration);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /users/register Get all registrations by a user
   * @apiVersion 2.0.0
   * @apiName Get registrations by user
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Registration[]} Array of the user's registrations
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getAllRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await this.registrationProcessor.getAllRegistrationsByUser(res.locals.user.uid, { ignoreCache: req.query.ignoreCache });
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {post} /users/extra-credit Track an extra credit class
   * @apiName Assign Extra Credit
   * @apiVersion 2.0.0
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiParam {String} cid   The uid associated with the class
   * @apiParam {String} [uid] The uid associated with a user's Firebase account
   * @apiUse AuthArgumentRequired
   * @apiSuccess {ExtraCreditAssignment} The inserted extra credit assignment
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async addExtraCreditAssignmentHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Validate incoming request
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }

    if (!req.body.cid || !parseInt(req.body.cid, 10)) {
      return Util.standardErrorHandler(new HttpError('Could not find valid class id', 400), next);
    }
    req.body.uid = req.body.uid || res.locals.user.uid;

    try {
      const ecAssignment = new ExtraCreditAssignment(req.body);
      const result = await this.extraCreditDataMapper.insert(ecAssignment);
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

  private async getExtraCreditAssignmentMiddleware(req, res, next) {
    /**
     * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
     */
    if (!res.locals.user) {
      res.locals.user = {};
    }
    if (!res.locals.user.privilege) {
      res.locals.user.privilege = AuthLevel.PARTICIPANT;
    }
    switch (req.query.type) {
      case 'user':
        if (!this.authService.verifyAclRaw(this.extraCreditPerm, AclOperations.READ_BY_UID, res.locals.user)) {
          return Util.standardErrorHandler(new HttpError('Insufficient permissions for this operation', 401), next);
        }
        return this.getExtraCreditAssignmentsByUidHandler(req, res, next);
      case 'class':
        if (!this.authService.verifyAclRaw(this.extraCreditPerm, AclOperations.READ_BY_CLASS, res.locals.user)) {
          return Util.standardErrorHandler(new HttpError('Insufficient permissions for this operation', 401), next);
        }
        return this.getExtraCreditAssignmentsByClassHandler(req, res, next);
      default:
        if (!this.authService.verifyAclRaw(this.extraCreditPerm, AclOperations.READ, res.locals.user)) {
          return Util.standardErrorHandler(new HttpError('Insufficient permissions for this operation', 401), next);
        }
        return this.getExtraCreditAssignmentHandler(req, res, next);
    }
  }

  /**
   * @api {get} /users/extra-credit/assignment Get an extra credit assignment
   * @apiVersion 2.0.0
   * @apiName Get Extra Credit Assignments
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiParam {String} uid - the id associated with the assignment
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ExtraCreditAssignment} The retrieved extra credit assignment
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getExtraCreditAssignmentHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }

    if (!req.query.uid || !parseInt(req.query.uid, 10)) {
      return Util.standardErrorHandler(new HttpError('Could not find valid assignment uid', 400), next);
    }

    try {
      const id: string = req.query.uid;
      const result = await this.extraCreditDataMapper.get(id);
      const response = new ResponseBody(
        'Success',
        200,
        result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /users/extra-credit/assignment?type=user Get all extra credit assignments for a hacker
   * @apiVersion 2.0.0
   * @apiName Get Extra Credit Assignments By User
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiParam {String} uid - the id associated with the hacker
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ExtraCreditAssignment} The retrieved extra credit assignments
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getExtraCreditAssignmentsByUidHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }

    if (!req.query.uid) {
      return Util.standardErrorHandler(new HttpError('Could not find valid uid', 400), next);
    }

    try {
      const uid: string = req.query.uid;
      const result = await this.extraCreditDataMapper.getByUser(uid);
      const response = new ResponseBody(
        'Success',
        200,
        result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /users/extra-credit/assignment?type=class Get all extra credit assignments for a class
   * @apiVersion 2.0.0
   * @apiName Get Extra Credit Assignments By Class
   * @apiGroup User
   * @apiPermission UserPermission
   *
   * @apiParam {Integer} cid - the id associated with the class
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {ExtraCreditAssignment} The retrieved extra credit assignments
   * @apiUse ResponseBodyDescription
   * @apiUse RequestOpts
   */
  private async getExtraCreditAssignmentsByClassHandler(req: Request, res: Response, next: NextFunction) {
    if (!req.query) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }

    if (!req.query.cid) {
      return Util.standardErrorHandler(new HttpError('Could not find valid class id', 400), next);
    }

    try {
      const cid: number = req.query.cid;
      const result = await this.extraCreditDataMapper.getByClass(cid);
      const response = new ResponseBody(
        'Success',
        200,
        result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

 /**
  * @api {post} /users/extra-credit/delete Remove an extra credit assignment
  * @apiVersion 2.0.0
  * @apiName Remove Extra Credit Assignment
  * @apiGroup User
  * @apiPermission DirectorPermission
  *
  * @apiParam {String} uid - the id associated with the hacker
  * @apiParam {String} hackathonUid - the id associated with the current hackathon
  * @apiUse AuthArgumentRequired
  * @apiUse IllegalArgumentError
  * @apiUse ResponseBodyDescription
  */
  private async deleteExtraCreditAssignmentHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (!req.body) {
      return Util.standardErrorHandler(new HttpError('Illegal request format', 400), next);
    }
    if (!req.body.uid || !parseInt(req.body.uid, 10)) {
      return Util.standardErrorHandler(new HttpError('Could not find valid assignment uid', 400), next);
    }
    try {
      const ecAssignment = new ExtraCreditAssignment({ uid: req.body.uid, cid: 1 });
      const result = await this.extraCreditDataMapper.delete(ecAssignment);
      const response = new ResponseBody(
        'Success',
        200,
        result);
      return this.sendResponse(res, response);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
