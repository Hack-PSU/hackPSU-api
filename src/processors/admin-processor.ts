import ajv, { ErrorObject } from 'ajv';
import { Inject, Injectable } from 'injection-js';
import { default as _ } from 'lodash';
import jsonAssetLoader from '../assets/schemas/json-asset-loader';
import { UidType } from '../js-common/common-types';
import { HttpError } from '../js-common/errors';
import { IAdminDataMapper, IEmail } from '../models/admin';
import { EmailHistory } from '../models/admin/types/email-history';
import { ResponseBody } from '../router/router-types';

const emailObjectSchema = jsonAssetLoader('emailObjectSchema');

export interface IAdminProcessor {
  validateEmails(emails: any[]): { goodEmails: any[]; badEmails: any[] };

  sendEmails(
    goodEmails: any[],
    badEmails: any[],
    html: string,
    subject: string,
    fromEmail: string,
    userId: UidType,
  ): Promise<ResponseBody>;

  validateAndSendEmails(
    emails: any[],
    html: string,
    subject: string,
    fromEmail: string,
    userId: UidType,
  ): Promise<ResponseBody>;
}

@Injectable()
export class AdminProcessor implements IAdminProcessor {
  constructor(
    @Inject('IAdminDataMapper') private readonly adminDataMapper: IAdminDataMapper,
  ) { }

  public async validateAndSendEmails(
    emails: any[],
    html: string,
    subject: string,
    fromEmail: string,
    userId: UidType,
  ) {
    const { goodEmails, badEmails } = this.validateEmails(emails);
    const badEmailsHistory: EmailHistory[] = badEmails
      .map((email) => {
        return new EmailHistory(
          userId,
          email.email,
          html,
          subject,
          email.name,
          Date.now(),
          'validation failed',
          email.error,
        );
      });
    return this.sendEmails(
      goodEmails,
      badEmailsHistory,
      html,
      subject,
      fromEmail,
      userId,
    );
  }

  /**
   * @VisibleForTesting
   */
  public validateEmails(emails: any[]): { goodEmails: IEmail[]; badEmails: any[] } {
    // Run validation
    const validator = new ajv({ allErrors: true });
    const validateFunction = validator.compile(emailObjectSchema);
    const goodEmails: IEmail[] = [];
    const badEmails: any[] = [];
    emails.map((emailObject: IEmail) => {
      if (validateFunction(emailObject)) {
        const emailObjectWithMap = { ...emailObject };
        emailObjectWithMap.substitutions = new Map<string, string>(_.entries(emailObject.substitutions));
        goodEmails.push(emailObjectWithMap);
      } else {
        badEmails.push({
          ...emailObject,
          error: validator.errorsText(validateFunction.errors as ErrorObject[]),
        });
      }
      return true;
    });
    if (goodEmails.length === 0) {
      throw new HttpError(
        'Emails could not be parsed properly',
        400,
      );
    }
    return { goodEmails, badEmails };
  }

  /**
   * @VisibleForTesting
   */
  public async sendEmails(
    goodEmails: IEmail[],
    badEmails: EmailHistory[],
    html: string,
    subject: string,
    fromEmail: string,
    userId: UidType,
  ) {
    const { successfulEmails, failedEmails } = await this.adminDataMapper.sendEmails(
      goodEmails,
      html,
      subject,
      userId,
      fromEmail,
    );
    const totalFailures = badEmails.concat(failedEmails);
    // If all failed, respond accordingly
    if (successfulEmails.length === 0) {
      throw new HttpError(
        { failures: totalFailures, text: 'Could not send emails' },
        500,
      );
    }

    await this.adminDataMapper.addEmailHistory(successfulEmails, totalFailures);
    if (totalFailures.length !== 0) {
      return new ResponseBody(
        'Some emails failed to send',
        207,
        { result: 'partial success', data: { successfulEmails, totalFailures } },
      );
    }
    return new ResponseBody(
      'Successfully sent all emails',
      200,
      { result: 'success', data: successfulEmails },
    );
  }
}
