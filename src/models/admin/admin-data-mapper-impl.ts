import * as admin from 'firebase-admin';
import { Inject, Injectable } from 'injection-js';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import squel from 'squel';
import { IEmail } from '.';
import { UidType } from '../../js-common/common-types';
import { HttpError } from '../../js-common/errors';
import { ICustomPermissions } from '../../services/auth';
import { AuthLevel, IFirebaseAuthService } from '../../services/auth/auth-types';
import { IAcl, IAdminAclPerm } from '../../services/auth/RBAC/rbac-types';
import { IEmailService } from '../../services/communication/email';
import { IDbResult } from '../../services/database';
import { GenericDataMapper } from '../../services/database/svc/generic-data-mapper';
import { MysqlUow } from '../../services/database/svc/mysql-uow.service';
import { IAdminDataMapper } from './index';
import { EmailHistory } from './types/email-history';
import UserRecord = admin.auth.UserRecord;

@Injectable()
export class AdminDataMapperImpl extends GenericDataMapper
  implements IAdminDataMapper, IAdminAclPerm {
  public GET_EMAIL: string = 'admin:get_email';
  public SEND_EMAIL: string = 'admin:send_email';
  public CREATE: string = 'admin:create';
  public REDUCE_PERMISSION: string = 'admin:reduce_perm';
  public MAKE_ACTIVE: string = 'admin:make_active';
  // Undefined actions for admin mapper
  public COUNT: string;
  public DELETE: string;
  public READ: string;
  public READ_ALL: string;
  public UPDATE: string;
  public tableName: string;

  // Undefined properties for admin mapper;
  protected pkColumnName: string;

  constructor(
    @Inject('IAcl') readonly acl: IAcl,
    @Inject('IAuthService') protected readonly authService: IFirebaseAuthService,
    @Inject('MysqlUow') protected readonly sql: MysqlUow,
    @Inject('IEmailService') protected readonly emailService: IEmailService,
  ) {
    super(acl);
    super.addRBAC(
      [this.GET_EMAIL, this.SEND_EMAIL, this.CREATE, this.MAKE_ACTIVE],
      [AuthLevel.DIRECTOR],
      undefined,
      [AuthLevel[AuthLevel.TEAM_MEMBER]],
    );
    super.addRBAC(
      this.REDUCE_PERMISSION,
      [AuthLevel.TECHNOLOGY],
      undefined,
      [AuthLevel[AuthLevel.DIRECTOR]],
    );
  }

  public async getEmailFromId(id: UidType): Promise<IDbResult<UserRecord>> {
    return from(this.authService.getUserId(id))
      .pipe(
        map((uid: UserRecord) => ({ result: 'Success', data: uid })),
      ).toPromise();
  }

  public async sendEmails(
    emails: IEmail[],
    html: string,
    subject: string,
    senderUid: UidType,
    fromEmail?: string,
  ) {
    // Substitute the HTML with the substituted data
    const failedEmails: EmailHistory[] = [];
    const successfulEmails: EmailHistory[] = [];
    await Promise.all(
      emails.map(
        async (email) => {
          try {
            const substitutedHtml = await this.emailService.emailSubstitute(
              html,
              email.name,
              email.substitutions,
            );
            await this.emailService.sendEmail(
              this.emailService.createEmailRequest(
                email.email,
                substitutedHtml,
                subject,
                fromEmail,
              ),
            );
            successfulEmails.push(new EmailHistory(
              senderUid,
              email.email,
              substitutedHtml,
              subject,
              email.name,
              Date.now(),
              '200',
            ));
          } catch (error) {
            failedEmails.push(new EmailHistory(
              senderUid,
              email.email,
              html,
              subject,
              email.name,
              Date.now(),
              '207',
              error,
            ));
          }
        }),
    );
    return { successfulEmails, failedEmails };
  }

  public async addEmailHistory(successfulEmails: EmailHistory[], failedEmails: EmailHistory[]) {
    const query = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .into('EMAIL_HISTORY')
      .setFieldsRows([
        ...(successfulEmails.map(email => email.dbRepresentation)),
        ...(failedEmails.map(email => email.dbRepresentation)),
      ])
      .toParam();
    query.text = query.text.concat(';');
    return from(
      this.sql.query(query.text, query.values, { cache: false }),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }

  /**
   *
   * @param {UidType | string} identifier Identifier to look up UserRecord with
   * @param {AuthLevel} permissionLevel Requested permission level
   * @param {AuthLevel} userPrivilege Permission level of the current user
   * @returns {Promise<IDbResult<void>>}
   */
  public async modifyPermissions(
    identifier: UidType | string,
    permissionLevel: AuthLevel,
    userPrivilege: AuthLevel,
  ): Promise<IDbResult<void>> {
    // Verify that if the permission is reduced, the user has the authority to do so
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await this.authService.getUserId(identifier);
    } catch (error) {
      throw new HttpError(
        'Could not retrieve user record. Did you provide a valid identifier?',
        400,
      );
    }
    if (
      permissionLevel < (userRecord.customClaims! as ICustomPermissions).privilege &&
      !this.authService.aclVerifier(userPrivilege, this.REDUCE_PERMISSION)
    ) {
      throw new HttpError('You do not have permission to reduce someone else\'s permission', 400);
    }

    // Set the custom claim in Firebase
    return from(
      this.authService.elevate(userRecord.uid, permissionLevel),
    ).pipe(
      map(() => ({ result: 'Success', data: undefined })),
    ).toPromise();
  }
}
