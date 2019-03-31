import { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { EpochNumber, UidType } from '../../../js-common/common-types';
import { AclOperations, IAclPerm } from '../RBAC/rbac-types';

export { RBAC } from '../RBAC/rbac';

export type Apikey = string;

export interface IApiToken {
  key: string;
  mintTime: EpochNumber;
  expiryTime: EpochNumber;
  valid: boolean;
  macAddress: string;
}

export interface IPinAuthenticator {
  pin: number;
  mintTime: EpochNumber;
  expiryTime: EpochNumber;
  valid: boolean;
}
export interface IAuthService {
  checkAuthentication(token: string): Promise<any>;
}

export interface IApikeyAuthService extends IAuthService {
  checkAuthentication(token?: Apikey, macAddress?: string): Promise<boolean>;

  generateApiKey(macAddress: string): Promise<IApiToken>;

  generatePinAuthenticator(): Promise<IPinAuthenticator>;

  checkPinAuthentication(pin: number): Promise<boolean>;
}

export interface IFirebaseAuthService extends IAuthService {
  checkAuthentication(token: string): Promise<admin.auth.DecodedIdToken>;

  authenticationMiddleware(request: Request, response: Response, next: NextFunction);

  verifyAcl(permission: IAclPerm, requestedOp: AclOperations | AclOperations[]): (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => void;

  getUserId(identifier: UidType | string): Promise<admin.auth.UserRecord>;

  /**
   * Returns whether the ACL found is allowed to access the operation of the requested
   * level
   */
  aclVerifier(
    foundAcl: AuthLevel | AuthLevel[],
    requestedOp: string,
    customParams?: any,
  ): boolean;

  elevate(uid, privilege): Promise<void>;

  verifyAclRaw(
    permission: IAclPerm,
    requestedOp: AclOperations | AclOperations[],
    userToken: admin.auth.DecodedIdToken,
    customVerifierParams?: any,
  ): boolean;
}

export enum AuthLevel {
  PARTICIPANT,
  VOLUNTEER,
  TEAM_MEMBER,
  DIRECTOR,
  TECHNOLOGY,
  FINANCE,
}
