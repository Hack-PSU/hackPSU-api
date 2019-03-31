import express from 'express';
import { Inject, Injectable } from 'injection-js';
import { HttpError } from '../../../js-common/errors';
import { Util } from '../../../js-common/util';
import { Event } from '../../../models/event/event';
import { IFirebaseAuthService } from '../../../services/auth/auth-types/';
import { AclOperations, IAclPerm } from '../../../services/auth/RBAC/rbac-types';
import { IDataMapperHackathonSpecific } from '../../../services/database';
import { Logger } from '../../../services/logging/logging';
import { ResponseBody } from '../../router-types';
import { LiveController } from '../controllers';

@Injectable()
export class EventsController extends LiveController {

  protected static baseRoute: string = 'events/';

  constructor(
    @Inject('IAuthService') private readonly authService: IFirebaseAuthService,
    @Inject('IEventDataMapper') private readonly dataMapper: IDataMapperHackathonSpecific<Event>,
    @Inject('IEventDataMapper') private readonly aclPerm: IAclPerm,
    @Inject('BunyanLogger') private readonly logger: Logger,
  ) {
    super();
    this.routes(this.router);
  }

  public routes(app: express.Router): void {
    if (!this.authService) {
      return;
    }
    if (!this.dataMapper) {
      return;
    }
    // Unauthenticated route
    app.get('/', (req, res, next) => this.getEventHandler(req, res, next));
    // Use authentication
    app.use((req, res, next) => this.authService.authenticationMiddleware(req, res, next));
    // Authenticated routes
    app
      .post(
        '/',
        this.authService.verifyAcl(this.aclPerm, AclOperations.CREATE),
        (req, res, next) => this.postEventHandler(req, res, next),
      )
      .put(
        '/',
        this.authService.verifyAcl(this.aclPerm, AclOperations.UPDATE),
        (req, res, next) => this.updateEventHandler(req, res, next),
      )
      .delete(
        '/',
        this.authService.verifyAcl(this.aclPerm, AclOperations.DELETE),
        (req, res, next) => this.deleteEventHandler(req, res, next),
      );
  }

  /**
   * Delete an event
   * @api {delete} /live/events/ Delete an existing event
   * @apiVersion 2.0.0
   * @apiName Update Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} uid - The uid of the event.
   * @apiUse AuthArgumentRequired
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async deleteEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body || !request.body.uid) {
      return next(new HttpError('Event uid must be provided', 400));
    }
    try {
      await this.dataMapper.delete(request.body.uid);
      const res = new ResponseBody('Success', 200, request.body.uid);
      return this.sendResponse(response, res);
    } catch (error) {
      Util.standardErrorHandler(error, next);
    }
  }

  /**
   * Updates an existing event
   * @api {put} /live/events/ Update an existing event
   * @apiVersion 2.0.0
   * @apiName Update Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} uid - The uid of the event.
   * @apiParam {String} eventLocation - The uid of the location for the event.
   * @apiParam {String} eventStartTime - The unix time for the start of the event.
   * @apiParam {String} eventEndTime - The unix time for the start of the event.
   * @apiParam {String} eventTitle - The title of the event.
   * @apiParam {String} eventDescription - The description of the event.
   * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Event} The updated event
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async updateEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body) {
      return next(new HttpError('No event provided to update', 400));
    }
    let event;
    try {
      event = new Event(request.body);
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some properties were not as expected', 401), next);
    }
    try {
      await this.dataMapper.update(event);
      const res = new ResponseBody('Success', 200, { result: 'Success', data: event });
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * Create a new event
   * @api {post} /live/events/ Add a new event
   * @apiVersion 2.0.0
   * @apiName New Event
   * @apiGroup Events
   * @apiPermission TeamMemberPermission
   *
   * @apiParam {String} eventLocation - The uid of the location for the event.
   * @apiParam {String} eventStartTime - The unix time for the start of the event.
   * @apiParam {String} eventEndTime - The unix time for the start of the event.
   * @apiParam {String} eventTitle - The title of the event.
   * @apiParam {String} eventDescription - The description of the event.
   * @apiParam {Enum} eventType - The type of the event. Accepted values: ["food","workshop","activity"]
   * @apiParam {String} [hackathon] - optional uid of hackathon
   * @apiUse AuthArgumentRequired
   * @apiSuccess {Event} The inserted event
   * @apiUse IllegalArgumentError
   * @apiUse ResponseBodyDescription
   */
  private async postEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    if (!request.body.eventLocation) {
      return next(new HttpError('Event location must be provided', 400));
    }
    if (!request.body.eventStartTime) {
      return next(new HttpError('Event start time must be provided', 400));
    }
    if (!request.body.eventEndTime) {
      return next(new HttpError('Event end time must be provided', 400));
    }
    if (!request.body.eventTitle) {
      return next(new HttpError('Event title must be provided', 400));
    }
    if (!request.body.eventDescription) {
      return next(new HttpError('Event description must be provided', 400));
    }
    if (!request.body.eventType) {
      return next(new HttpError('Event type must be provided', 400));
    }
    let event;
    try {
      event = new Event(request.body);
    } catch (error) {
      return Util.standardErrorHandler(new HttpError('Some properties were not as expected', 400), next);
    }
    try {
      const result = await this.dataMapper.insert(event);
      const res = new ResponseBody('Success', 200, { result: 'Success', data: result });
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }

  /**
   * This function gets all the events for the current hackathon
   * @api {get} /live/events/ Get all the events
   * @apiVersion 2.0.0
   * @apiName Get events
   * @apiGroup Events
   * @apiUse RequestOpts
   * @apiSuccess {Event[]} Array of current events
   * @apiUse ResponseBodyDescription
   */
  private async getEventHandler(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    try {
      const stream = await this.dataMapper.getAll({
        byHackathon: !request.query.allHackathons,
        count: request.query.limit,
        hackathon: request.query.hackathon,
        startAt: request.query.offset,
        ignoreCache: request.query.ignoreCache,
      });
      const res = new ResponseBody('Success', 200, stream);
      return this.sendResponse(response, res);
    } catch (error) {
      return Util.errorHandler500(error, next);
    }
  }
}
