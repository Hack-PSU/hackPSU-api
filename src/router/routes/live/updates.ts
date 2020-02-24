import express from 'express';
import { Inject, Injectable } from 'injection-js';
import { HttpError, RouteNotImplementedError } from '../../../JSCommon/errors';
import { Util } from '../../../JSCommon/util';
import { IUpdateDataMapper } from '../../../models/update';
import { Update } from '../../../models/update/update';
import { IUpdateProcessor } from '../../../processors/update-processor';
import { IFirebaseAuthService } from '../../../services/auth/auth-types/';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { ResponseBody } from '../../router-types';
import { LiveController } from '../controllers';

@Injectable()
export class UpdatesController extends LiveController {
  protected static baseRoute = 'updates/';

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IUpdateProcessor') private readonly updateProcessor: IUpdateProcessor,
    @Inject('IUpdateDataMapper') private readonly updateDataMapper: IUpdateDataMapper,
    @Inject('IUpdateDataMapper') private readonly acl: IAclPerm,
  ) {
    super();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    if (!this.authService || !this.updateDataMapper || !this.acl) {
      return;
    }
    // Unauthenticated route
    app.get('/reference', (req, res, next) => this.getUpdateReferenceHandler(res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app
      .get(
        '/',
        this.authService.verifyAcl(this.acl, AclOperations.READ),
        (req, res, next) => this.getUpdateHandler(res, next),
      )
      .post(
        '/',
        this.authService.verifyAcl(this.acl, AclOperations.CREATE),
        (req, res, next) => this.postUpdateHandler(req, res, next),
      )
      .post(
        '/update',
        this.authService.verifyAcl(this.acl, AclOperations.UPDATE),
        (req, res, next) => this.updateUpdateHandler(req, res, next),
      )
      .post(
        '/delete',
        this.authService.verifyAcl(this.acl, AclOperations.DELETE),
        (req, res, next) => this.deleteUpdateHandler(req, res, next),
      );
  }

  /**
   * @api {post} /live/updates/delete Delete an update
   * @apiVersion 2.0.0
   * @apiName Delete update
   * @apiGroup Updates
   * @apiPermission TeamMemberPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiParam {String} uid The id of the update to be deleted
   * @apiParam {String} [hackathon=current] The hackathon the update was made for
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async deleteUpdateHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.uid) {
      return Util.standardErrorHandler(new HttpError('Update id must be provided', 400), next);
    }

    try {
      const result = await this.updateDataMapper.delete(request.body);
      const res = new ResponseBody('Success', 200, result);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  private updateUpdateHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    next(new RouteNotImplementedError('Update editing is not supported at this time'));
  }

  /**
   * @api {post} /live/updates/ Add a new update
   * @apiVersion 2.0.0
   * @apiName New update
   * @apiGroup Updates
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} updateTitle The title of the update
   * @apiParam {String} updateText The text of the update
   * @apiParam {String} [updateImage] The url of the image part of the update
   * @apiParam {Number} [updateTime = now] The time the update is created in milliseconds
   * @apiParam {Boolean} [pushNotification = false] Whether to send out a push notification with this update
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Update} data The added update
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async postUpdateHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.updateTitle) {
      return Util.standardErrorHandler(new HttpError('Update title must be provided', 400), next);
    }
    if (!request.body.updateText) {
      return Util.standardErrorHandler(new HttpError('Update message must be provided', 400), next);
    }
    if (!request.body.updateImage) {
      request.body.updateImage = 'https://app.hackpsu.org/assets/images/logo.svg';
    }
    const generatedUpdate = new Update(request.body);
    try {
      const res = await this.updateProcessor.processUpdate(generatedUpdate);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * This function gets the Firebase Database reference for live updates
   * @api {get} /live/updates/reference Get the db reference for updates
   * @apiVersion 2.0.0
   * @apiName Get Update reference
   * @apiGroup Updates
   *
   * @apiSuccess {String} data The database reference to updates for the current hackathon
   * @apiUse ResponseBodyDescription
   */
  private async getUpdateReferenceHandler(
    response: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const reference = await this.updateDataMapper.getReference();
      const res = new ResponseBody('Success', 200, reference);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * @api {get} /live/updates/ Get all the updates
   * @apiVersion 2.0.0
   * @apiName Get Updates
   * @apiGroup Updates
   * @apiPermission UserPermission
   *
   * @apiUse AuthArgumentRequired
   *
   * @apiSuccess {Update[]} data Array of current updates
   * @apiUse ResponseBodyDescription
   */
  private async getUpdateHandler(
    response: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const stream = await this.updateDataMapper.getAll();
      const res = new ResponseBody('Success', 200, stream);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
