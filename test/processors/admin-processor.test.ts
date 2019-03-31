import { expect } from 'chai';
// @ts-ignore
// tslint:disable-next-line:import-name
import _ from 'lodash';
import 'mocha';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { HttpError } from '../../src/js-common/errors';
import { AdminDataMapperImpl } from '../../src/models/admin';
import { EmailHistory } from '../../src/models/admin/types/email-history';
import { AdminProcessor } from '../../src/processors/admin-processor';

// Global mocks
const adminDMMock = mock(AdminDataMapperImpl);
let adminDataMapper: AdminDataMapperImpl;

describe('TEST: Admin Processor', () => {
  beforeEach(() => {
    adminDataMapper = instance(adminDMMock);
  });

  afterEach(() => {
    reset(adminDMMock);
  });
  describe('TEST: Validate emails', () => {
    it('it processes a valid list of emails to send', async () => {
      // GIVEN: An admin processor
      const adminProcessor = new AdminProcessor(
        adminDataMapper,
      );
      // GIVEN: a valid array of emails to validate
      const emails = [
        {
          email: 'test@email.com',
          name: 'test name',
          substitutions: {},
        },
        {
          email: 'test2@email.com',
          name: 'test name 2',
          substitutions: {
            subtitutable: 'new-word',
          },
        },
      ];
      // WHEN: Validating the emails
      const { badEmails } = await adminProcessor.validateEmails(emails);
      // THEN: no emails were marked as bad
      expect(badEmails.length).to.equal(0);
    });

    it('it processes a valid list of emails to send from a list with invalid emails', async () => {
      // GIVEN: An admin processor
      const adminProcessor = new AdminProcessor(
        adminDataMapper,
      );
      // GIVEN: an invalid array of emails to validate
      const emails = [
        {
          name: 'test name',
          substitutions: new Map<string, string>(),
        },
        {
          email: 'test2@email.com',
          name: 'test name 2',
          substitutions: new Map<string, string>([['substitutable', 'new-word']]),
        },
      ];
      // WHEN: Validating the emails
      const { goodEmails, badEmails } = await adminProcessor.validateEmails(emails);
      // THEN: the bad emails were marked as bad
      expect(badEmails.length).to.equal(1);
      expect(badEmails[0])
        .to
        .deep
        .equal(_.extend(emails[0], { error: 'data should have required property \'email\'' }));
      // THEN: the good emails were properly separated
      expect(goodEmails[0]).to.deep.equal(emails[1]);
    });

    it('it throws an error if no emails were processable', async () => {
      // GIVEN: An admin processor
      const adminProcessor = new AdminProcessor(
        adminDataMapper,
      );
      // GIVEN: an array of invalid emails to validate
      const emails = [];
      // WHEN: Validating the emails
      try {
        await adminProcessor.validateEmails(emails);
      } catch (error) {
        // THEN: An error was thrown
        expect(error instanceof HttpError).to.equal(true);
        expect(error.message).to.equal('Emails could not be parsed properly');
        expect(error.status).to.equal(400);
      }
    });
  });

  describe('TEST: Send emails', () => {
    before(() => {
      when(adminDMMock.sendEmails(anything(), anything(), anything(), anything(), anything()))
        .thenResolve({
          successfulEmails: [new EmailHistory(
            'test uid',
            'test recpient',
            'test content',
            'test subject',
            'test name',
            Date.now(),
            'success',
          )], failedEmails: [],
        });
      adminDataMapper = instance(adminDMMock);
    });
    it('it processes a valid list of emails to send', async () => {
      // GIVEN: An admin processor
      const adminProcessor = new AdminProcessor(
        adminDataMapper,
      );
      // GIVEN: a valid array of emails
      const emails = [
        {
          email: 'test@email.com',
          name: 'test name',
          substitutions: new Map<string, string>(),
        },
        {
          email: 'test2@email.com',
          name: 'test name 2',
          substitutions: new Map<string, string>([['substitutable', 'new-word']]),
        },
      ];
      // WHEN: Sending the emails
      await adminProcessor.sendEmails(
        emails,
        [],
        'validHtml',
        'test subject',
        'test@email.com',
        'test uid',
      );
      // THEN: The emails were sent using the datamapper
      verify(adminDMMock.sendEmails(
        emails,
        'validHtml',
        'test subject',
        'test uid',
        'test@email.com',
      )).once();
      // THEN: The emails were added to the email sending history
      verify(adminDMMock.addEmailHistory(anything(), anything())).once();
    });
  });
});
