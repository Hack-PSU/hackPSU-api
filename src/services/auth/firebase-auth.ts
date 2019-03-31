import { validate } from 'email-validator';
import express, { Request } from 'express';
import * as firebase from 'firebase-admin';
import { Inject, Injectable } from 'injection-js';
import 'reflect-metadata';
import { UidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { Environment, Util } from '../../js-common/util';
import { IFirebaseService } from '../common/firebase/firebase-types/firebase-service';
import { Logger } from '../logging/logging';
import { AuthLevel, IFirebaseAuthService } from './auth-types/';
import {
  AclOperations,
  IAcl,
  IAclPerm,
  IAdminAclPerm,
  IExtraCreditAclPerm,
} from './RBAC/rbac-types';

@Injectable()
export class FirebaseAuthService implements IFirebaseAuthService {

  private static extractedPermission(requestedOp: AclOperations, permission: IAclPerm) {
    let requestPermission: string;
    switch (requestedOp) {
      case AclOperations.CREATE:
        requestPermission = permission.CREATE;
        break;
      case AclOperations.UPDATE:
        requestPermission = permission.UPDATE;
        break;
      case AclOperations.DELETE:
        requestPermission = permission.DELETE;
        break;
      case AclOperations.READ:
        requestPermission = permission.READ;
        break;
      case AclOperations.READ_ALL:
        requestPermission = permission.READ_ALL;
        break;
      case AclOperations.COUNT:
        requestPermission = permission.COUNT;
        break;
      case AclOperations.GET_EMAIL:
        // Only supported for IAdminAclPerm
        requestPermission = (permission as IAdminAclPerm).GET_EMAIL;
        break;
      case AclOperations.MAKE_ACTIVE:
        // Only supported for IAdminAclPerm
        requestPermission = (permission as IAdminAclPerm).MAKE_ACTIVE;
        break;
      case AclOperations.REDUCE_PERMISSION:
        // Only supported for IAdminAclPerm
        requestPermission = (permission as IAdminAclPerm).REDUCE_PERMISSION;
        break;
      case AclOperations.SEND_EMAIL:
        // Only supported for IAdminAclPerm
        requestPermission = (permission as IAdminAclPerm).SEND_EMAIL;
        break;
      case AclOperations.READ_ALL_CLASSES:
        // Only supported for IExtraCreditAclPerm
        requestPermission = (permission as IExtraCreditAclPerm).READ_ALL_CLASSES;
        break;
      case AclOperations.READ_BY_UID:
        // Only supported for IExtraCreditAclPerm
        requestPermission = (permission as IExtraCreditAclPerm).READ_BY_UID;
        break;
      case AclOperations.READ_BY_CLASS:
        // Only supported for IExtraCreditAclPerm
        requestPermission = (permission as IExtraCreditAclPerm).READ_BY_CLASS;
        break;
      default:
        requestPermission = '';
        break;
    }
    return requestPermission;
  }
  private admin: firebase.auth.Auth;

  constructor(
    @Inject('FirebaseService') private firebaseService: IFirebaseService,
    @Inject('IAcl') private acl: IAcl,
    @Inject('BunyanLogger') private logger: Logger,
  ) {
    this.admin = firebaseService.admin.auth();
  }

  /**
   * Checks if the provided token is authenticated
   * @param token
   * @return {Promise<admin.auth.DecodedIdToken>}
   */
  public checkAuthentication(token: string): Promise<firebase.auth.DecodedIdToken> {
    return this.admin.verifyIdToken(token);
  }

  /**
   * Express.js style middleware function that can be used to authenticate
   * a request with Firebase
   * @param {Request} request The HTTP request object
   * In order to properly verify the request, this function reads the
   * request.headers['idtoken'] field. This should be set properly in the request
   * @param response
   * @param next
   */
  public async authenticationMiddleware(
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    // Allow all requests on local
    if (Util.getCurrentEnv() === Environment.DEBUG) {
      return next();
    }
    if (!request.headers.idtoken) {
      return Util.standardErrorHandler(new HttpError('ID token must be provided', 401), next);
    }
    try {
      const decodedToken = await this.checkAuthentication(request.headers.idtoken as string);
      response.locals.user = decodedToken;
      response.locals.privilege = decodedToken.privilege;
      next();
    } catch (e) {
      this.logger.info(e);
      return Util.standardErrorHandler(new HttpError(e.message || e, 401), next);
    }
  }

  /**
   * Verifies if the given user has the ability to access the requested operation
   * NOTE: This function requires that response.locals.user is set.
   * @param {IAclPerm} permission The operation permission for the object e.g. event:create
   * @param {AclOperations} requestedOp The requested operation to perform
   * @returns {(request: Request, response: e.Response, next: e.NextFunction) => void}
   */
  public verifyAcl(permission: IAclPerm, requestedOp: AclOperations | AclOperations[]) {
    return (request: express.Request, response: express.Response, next: express.NextFunction) => {
      /**
       * The user is an {@link AuthLevel.PARTICIPANT} which is the default AuthLevel
       */
      if (!response.locals.user) {
        response.locals.user = {};
      }
      if (!response.locals.user.privilege) {
        response.locals.user.privilege = AuthLevel.PARTICIPANT;
      }
      try {
        if (this.verifyAclRaw(
          permission,
          requestedOp,
          response.locals.user,
          response.locals.customVerifierParams,
        )) return next();
        return Util.standardErrorHandler(
          new HttpError(
            'Insufficient permissions for this operation',
            401,
          ),
          next,
        );
      } catch (error) {
        return Util.standardErrorHandler(error, next);
      }
    };
  }

  public verifyAclRaw(
    permission: IAclPerm,
    requestedOp: AclOperations | AclOperations[],
    userToken: firebase.auth.DecodedIdToken,
    customVerifierParams?: any,
  ): boolean {
    if (Util.getCurrentEnv() === Environment.DEBUG) {
      return true;
    }
    if (Array.isArray(requestedOp)) {
      (requestedOp as AclOperations[]).every((op) => {
        return this.verifyAclInternalOrThrow(op, permission, userToken, customVerifierParams);
      });
      return true;
    }
    this.verifyAclInternalOrThrow(
      requestedOp,
      permission,
      userToken,
      customVerifierParams,
    );
    return true;
  }

  public getUserId(identifier: UidType | string) {
    if (validate(identifier)) {
      return this.admin.getUserByEmail(identifier);
    }
    return this.admin.getUser(identifier);
  }

  /**
   * Returns whether the ACL found is allowed to access the operation of the requested
   * level
   */
  public aclVerifier(
    foundAcl: AuthLevel | AuthLevel[],
    requestedOp: string,
    customParams?: any,
  ): boolean {
    if (Array.isArray(foundAcl)) {
      return (foundAcl as AuthLevel[]).some(
        acl => this.acl.can(AuthLevel[acl], requestedOp, customParams));
    }
    return this.acl.can(AuthLevel[foundAcl], requestedOp, customParams);
  }

  public elevate(uid: UidType, privilege: AuthLevel) {
    return this.admin.setCustomUserClaims(uid, { privilege, admin: true });
  }

  private verifyAclInternalOrThrow(
    requestedOp: AclOperations,
    permission: IAclPerm,
    userToken: firebase.auth.DecodedIdToken,
    customVerifierParams: any,
  ) {
    const requestPermission = FirebaseAuthService.extractedPermission(requestedOp, permission);
    if (!this.aclVerifier(
      userToken.privilege,
      requestPermission,
      customVerifierParams,
    )) {
      this.logger.info(`Requested permission was: ${requestPermission}`);
      this.logger.info(userToken);
      throw new HttpError('Insufficient permissions for this operation', 401);
    }
    return true;
  }
}

//
// /**
//  * Makes the provided UID an administrator with the provided privilege level
//  * @param uid
//  * @param privilege
//  * @return {Promise<void>}
//  */

//
// /**
//  * Retrieve the userID base on the email provided
//  *  @param email
//  *  @return Promise{firebase.auth.UserRecord}
//  */
// export function getUserId(email) {
//   return admin.auth().getUserByEmail(email);
// }
//
// /**
//  *
//  * @param uid
//  * @return {Promise<firebase.auth.UserRecord>}
//  */
// export function getUserData(uid) {
//   return admin.auth().getUser(uid);
// }
