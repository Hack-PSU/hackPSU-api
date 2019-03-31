import * as request from 'request';
import { EmailReplacementError } from '../../../js-common/errors';
import { IEmailData } from './email-types';

export interface IEmailService {
  sendEmail(data: IEmailData): Promise<[request.Response, {}]>;

  createEmailRequest(
    email: string,
    htmlContent: string,
    subject: string,
    // fromEmail is an optional field. The implementation
    // should select an email by default in case on undefined
    fromEmail?: string,
  ): IEmailData;

  /**
   * This function substitutes the provided
   * @param {String} html A string of HTML text that forms the body of the email.
   *        All substitutables must be formatted as $substitutable$.
   *        The HTML MUST contain the $NAME$ substitutable.
   * @param {String} name The name of the recipient
   * @param {Map<string, string>>} [substitutions] A map of strings with the following format
   *        { keyword-to-substitute: string-to-substitute-with, ... };
   *        Example: { date: "09-23-2000" }
   * @return {string} return substituted version of the html
   * @throws EmailReplacementError
   */
  emailSubstitute(html: string, name: string, substitutions?: Map<string, string>): string;
}
