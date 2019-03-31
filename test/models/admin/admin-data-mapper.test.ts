// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import * as admin from 'firebase-admin';
import _ from 'lodash';
import 'mocha';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { HttpError } from '../../../src/js-common/errors';
import { AdminDataMapperImpl, IAdminDataMapper } from '../../../src/models/admin';
import { EmailHistory } from '../../../src/models/admin/types/email-history';
import { FirebaseAuthService } from '../../../src/services/auth';
import { AuthLevel, IFirebaseAuthService } from '../../../src/services/auth/auth-types';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { IEmailService } from '../../../src/services/communication/email';
import { SendgridService } from '../../../src/services/communication/email/sendgrid.service';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import UserRecord = admin.auth.UserRecord;

const authServiceMock = mock(FirebaseAuthService);
const emailServiceMock = mock(SendgridService);
let emailService: IEmailService;
let authService: IFirebaseAuthService;
let adminDataMapper: IAdminDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);

const acl: IAcl = new RBAC();

describe('TEST: Admin data mapper', () => {

  describe('TEST: Get user record by id', () => {
    beforeEach(() => {
      when(authServiceMock.getUserId(anyString()))
        .thenResolve(Substitute.for<UserRecord>());
      authService = instance(authServiceMock);
      emailService = instance(emailServiceMock);
      mysqlUow = instance(mysqlUowMock);
      // Configure Admin Data Mapper
      adminDataMapper = new AdminDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        emailService,
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
      reset(authServiceMock);
      reset(emailServiceMock);
    });

    it('calls the correct method to get user record by id', async () => {
      // GIVEN: An admin data mapper
      // WHEN: Retrieving the user record by id
      await adminDataMapper.getEmailFromId('test uid');

      // THEN: Calls firebase to get the user record
      verify(authServiceMock.getUserId('test uid')).once();
    });
  });

  describe('TEST: Modify user permissions', () => {
    beforeEach(() => {
      const mockedUserRecord = Substitute.for<UserRecord>();
      // @ts-ignore
      mockedUserRecord.customClaims.returns({ privilege: 3, admin: true });
      when(authServiceMock.getUserId(anyString()))
        .thenResolve(mockedUserRecord);
      when(authServiceMock.elevate(anything(), anything()))
        .thenResolve();
      authService = instance(authServiceMock);
      emailService = instance(emailServiceMock);
      mysqlUow = instance(mysqlUowMock);
      // Configure Admin Data Mapper
      adminDataMapper = new AdminDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        emailService,
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
      reset(authServiceMock);
      reset(emailServiceMock);
    });

    it('calls the correct method to modify user permissions', async () => {
      // GIVEN: An admin data mapper
      // WHEN: Elevating user privilege
      await adminDataMapper.modifyPermissions('test uid', AuthLevel.TECHNOLOGY, AuthLevel.DIRECTOR);

      // THEN: Calls firebase to get the user record
      verify(authServiceMock.getUserId('test uid')).once();
      // THEN: Calls firebase to elevate the user's permissions
      verify(authServiceMock.elevate('test uid', AuthLevel.TEAM_MEMBER));
    });

    it('throws an error when no identifier provided', async () => {
      // GIVEN: An admin data mapper
      when(authServiceMock.getUserId(anyString()))
        .thenThrow(new Error('test error'));
      authService = instance(authServiceMock);
      // Configure Admin Data Mapper
      adminDataMapper = new AdminDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        emailService,
      );
      // WHEN: Elevating user privilege
      try {
        await adminDataMapper.modifyPermissions(
          'test uid',
          AuthLevel.TECHNOLOGY,
          AuthLevel.DIRECTOR,
        );
      } catch (error) {
        // THEN: Error was thrown
        expect(error.status).to.equal(400);
        expect(error.message)
          .to
          .equal('Could not retrieve user record. Did you provide a valid identifier?');
        return;
      }
      expect(true).to.equal(false);
    });

    it('throws an error when user does not have permission to lower privilege', async () => {
      // GIVEN: An admin data mapper
      // WHEN: Elevating user privilege
      try {
        await adminDataMapper.modifyPermissions(
          'test uid',
          AuthLevel.TEAM_MEMBER,
          AuthLevel.VOLUNTEER,
        );
      } catch (error) {
        // THEN: Error was thrown
        expect(error.status).to.equal(400);
        expect(error.message)
          .to
          .equal('You do not have permission to reduce someone else\'s permission');
        return;
      }
      expect(true).to.equal(false);
    });

    it(
      'calls the correct method to modify user permissions when user has permission to reduce privilege level and reducing privilege level',
      async () => {
        // GIVEN: An admin data mapper
        when(authServiceMock.aclVerifier(anything(), anything()))
          .thenReturn(true);
        authService = instance(authServiceMock);
        adminDataMapper = new AdminDataMapperImpl(
          acl,
          authService,
          mysqlUow,
          emailService,
        );
        // WHEN: Elevating user privilege
        await adminDataMapper.modifyPermissions(
          'test uid',
          AuthLevel.VOLUNTEER,
          AuthLevel.TECHNOLOGY,
        );

        // THEN: Calls firebase to get the user record
        verify(authServiceMock.getUserId('test uid')).once();
        // THEN: Calls firebase to elevate the user's permissions
        verify(authServiceMock.elevate('test uid', AuthLevel.TEAM_MEMBER));
      },
    );
  });

  describe('TEST: Send emails', () => {
    const emailRequest = {
      from: 'test@email.com',
      html: 'test html',
      replyTo: 'test@email.com',
      subject: 'test subject',
      to: 'test name',
    };

    beforeEach(() => {
      when(authServiceMock.getUserId(anyString()))
        .thenResolve(Substitute.for<UserRecord>());
      when(emailServiceMock.emailSubstitute(anyString(), anyString(), anything()))
        .thenReturn('substituted html');
      when(emailServiceMock.createEmailRequest(anyString(), anyString(), anyString(), anyString()))
        .thenReturn(emailRequest);
      authService = instance(authServiceMock);
      emailService = instance(emailServiceMock);
      mysqlUow = instance(mysqlUowMock);
      // Configure Admin Data Mapper
      adminDataMapper = new AdminDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        emailService,
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
      reset(authServiceMock);
      reset(emailServiceMock);
    });

    it('it processes all the emails and sends them', async () => {
      const substitutions = new Map<string, string>([['substitutable', 'new-word']]);
      // GIVEN: Well formatted emails to send
      const emails = [
        {
          email: 'test@email.com',
          name: 'test name',
          substitutions: new Map<string, string>(),
        },
        {
          email: 'test2@email.com',
          name: 'test name 2',
          substitutions: substitutions,
        },
      ];
      // WHEN: Sending emails
      await adminDataMapper.sendEmails(
        emails,
        'test html',
        'test subject',
        'test uid',
        'test@email.com',
      );
      emails.forEach((email) => {
        // THEN: Runs through all substitutions
        verify(emailServiceMock.emailSubstitute('test html', email.name, email.substitutions))
          .once();
        // THEN: Creates the email request
        verify(emailServiceMock.createEmailRequest(
          email.email,
          'substituted html',
          'test subject',
          'test@email.com',
        )).once();
        // THEN: Sends the email
        verify(emailServiceMock.sendEmail(emailRequest)).twice();
      });
    });
  });

  describe('TEST: Add Email history', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      authService = instance(authServiceMock);
      emailService = instance(emailServiceMock);
      mysqlUow = instance(mysqlUowMock);
      // Configure Admin Data Mapper
      adminDataMapper = new AdminDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        emailService,
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
      reset(authServiceMock);
      reset(emailServiceMock);
    });

    it('generates the expected SQL to add email history', async () => {
      // GIVEN: Email history to add
      const successfulHistory = [new EmailHistory(
        'test sender',
        'test recipient',
        'test content',
        'test subject',
        'test name',
        Date.now(),
        'success',
      )];
      const failedHistory = [new EmailHistory(
        'test sender',
        'test recipient',
        'test content',
        'test subject',
        'test name',
        Date.now(),
        'success',
        new HttpError('test error message', 400),
      )];
      // WHEN: Adding email history
      await adminDataMapper.addEmailHistory(successfulHistory, failedHistory);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `EMAIL_HISTORY` (`sender`, `recipient`, `email_content`, ' +
        '`subject`, `recipient_name`, `time`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?), ' +
        '(?, ?, ?, ?, ?, ?, ?);';
      const expectedParams = [
        ..._.values(successfulHistory[0].dbRepresentation),
        ..._.values(failedHistory[0].dbRepresentation),
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
