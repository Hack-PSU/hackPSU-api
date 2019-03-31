import * as fs from 'fs';
import { Inject, Injectable } from 'injection-js';
import * as path from 'path';
import request from 'request';
import { UidType } from '../js-common/common-types';
import { Hackathon } from '../models/hackathon';
import { IRegisterDataMapper } from '../models/register';
import { Registration } from '../models/register/registration';
import { ResponseBody } from '../router/router-types';
import { FeatureFlagService } from '../services/common/feature-flags/feature-flag-service';
import { FeatureFlag } from '../services/common/feature-flags/feature-flags-types';
import { IEmailService } from '../services/communication/email';
import { IDataMapper, IDbResult } from '../services/database';
import { IUowOpts } from '../services/database/svc/uow.service';

// TODO: Refactor this to retrieve email template from cloud storage?
const EMAIL_TEMPLATE_PATH = '../assets/emails/email_template.html';
const REGISTRATION_EMAIL_BODY = '../assets/emails/registration_body.html';
const emailTemplate = fs.readFileSync(path.join(__dirname, EMAIL_TEMPLATE_PATH), 'utf-8');
const registrationEmailBody = fs.readFileSync(
  path.join(__dirname, REGISTRATION_EMAIL_BODY),
  'utf-8',
);
const emailHtml = emailTemplate.replace('$$BODY$$', registrationEmailBody);

export interface IRegistrationProcessor {
  processRegistration(registration: Registration): Promise<ResponseBody>;

  getAllRegistrationsByUser(id: UidType, opts?: IUowOpts): Promise<ResponseBody>;

  sendRegistrationEmail(registration: Registration): Promise<[request.Response, {}]>;

  normaliseRegistrationData(registration: any): void;
}

@Injectable()
export class RegistrationProcessor implements IRegistrationProcessor {

  constructor(
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IHackathonDataMapper') private readonly hackathonDataMapper: IDataMapper<Hackathon>,
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject('FeatureFlagService') private readonly featureFlagService: FeatureFlagService,
  ) {}

  public async processRegistration(registration: Registration) {
    const result = await this.registerDataMapper.insert(registration);
    const submission = await this.registerDataMapper.submit(registration);
    if (this.featureFlagService.isFeatureEnabled(FeatureFlag.CONFIRMATION_EMAIL)) {
      await this.sendRegistrationEmail(registration);
    }
    return new ResponseBody(
      'Success',
      200,
      { result: 'Success', data: { registration, result, submission } },
    );
  }

  public async sendRegistrationEmail(registration: Registration): Promise<[request.Response, {}]> {
    const preparedHtml = await this.emailService.emailSubstitute(emailHtml, registration.firstname);
    const emailData = this.emailService.createEmailRequest(
      registration.email,
      preparedHtml,
      'Thank you for your Registration',
      '',
    );
    return this.emailService.sendEmail(emailData);
  }

  public normaliseRegistrationData(registration: any) {
    /** Converting boolean strings to booleans types in registration */
    registration.travelReimbursement = registration.travelReimbursement === true || registration.travelReimbursement === 'true';

    registration.firstHackathon = registration.firstHackathon === true || registration.firstHackathon === 'true';

    registration.eighteenBeforeEvent = registration.eighteenBeforeEvent === true || registration.eighteenBeforeEvent === 'true';

    registration.mlhcoc = registration.mlhcoc === true || registration.mlhcoc === 'true';

    registration.mlhdcp = registration.mlhdcp === true || registration.mlhdcp === 'true';
  }

  public async getAllRegistrationsByUser(id: UidType, opts?: IUowOpts): Promise<ResponseBody> {
    const hackathons = await this.hackathonDataMapper.getAll();
    const registrations = (await Promise.all(
      hackathons.data
        .map(
          hackathon => this.registerDataMapper
            .get({ uid: id, hackathon: hackathon.uid }, opts)
            .catch(() => undefined),
        ),
    ))
      .filter(a => a !== undefined)
      .map((result: IDbResult<Registration>) => result.data);
    return new ResponseBody(
      'Success',
      200,
      { result: 'Success', data: registrations },
    );
  }
}
