// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../src/models/register';
import { RegisterDataMapperImpl } from '../../../src/models/register/register-data-mapper-impl';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../../src/models/register/registration';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let registerDataMapper: IRegisterDataMapper;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);

const acl: IAcl = new RBAC();
const validRegistration = new Registration({
  academicYear: AcademicYear.FRESHMAN,
  allergies: null,
  codingExperience: CodingExperience.NONE,
  dietaryRestriction: null,
  eighteenBeforeEvent: true,
  email: 'test@email.com',
  ethnicity: 'test ethnicity',
  expectations: 'test expectations',
  firstHackathon: true,
  firstName: 'test first name',
  gender: Gender.NODISCLOSE,
  lastName: 'test last name',
  major: 'test major',
  mlhcoc: true,
  mlhdcp: true,
  phone: '1234567890',
  projectDesc: 'test description',
  referral: 'test referral',
  resume: null,
  shirtSize: ShirtSize.MEDIUM,
  travelReimbursement: false,
  uid: 'test uid',
  university: 'test university',
  veteran: VeteranOptions.NODISCLOSE,
  time: Date.now(),
  submitted: true,
  interests: 'test interests',
});

describe('TEST: Register data mapper', () => {
  beforeEach(() => {
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    (activeHackathonDataMapper.tableName as any).mimicks(() => 'HACKATHON');
  });

  describe('TEST: Registration read', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{ time: Date.now() }]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to read a registration based on the provided uid', async () => {
      // GIVEN: A registration with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this registration
      await registerDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT `registration`.*, `hackathon`.`name`, `hackathon`.`start_time`,' +
        ' `hackathon`.`end_time`, `hackathon`.`base_pin`, `hackathon`.`active`' +
        ' FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON' +
        ' (hackathon.uid = registration.hackathon) WHERE (registration.uid= ?) AND' +
        ' (registration.hackathon = ?) ORDER BY time DESC;';
      const expectedParams = [uid.uid, uid.hackathon];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
    it(
      'generates the correct sql to read a registration with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A registration with a valid ID to read from
        const uid = { uid: 'test uid', hackathon: 'test uid' };
        // WHEN: Retrieving a single field for this registration
        await registerDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `REGISTRATION` `registration` ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = registration.hackathon) ' +
          'WHERE (registration.uid= ?) AND (registration.hackathon = ?) ORDER BY time DESC;';
        const expectedParams = [uid.uid, uid.hackathon];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Registration read all', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to read all registrations', async () => {
      // GIVEN: A registration data mapper instance
      // WHEN: Retrieving all registration data
      await registerDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT `registration`.*, `hackathon`.`name`, ' +
        '`hackathon`.`start_time`, `hackathon`.`end_time`, `hackathon`.`base_pin`, ' +
        '`hackathon`.`active` FROM `REGISTRATION` `registration` INNER JOIN ' +
        '`HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all registration with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A registration data mapper instance
        // WHEN: Retrieving one field for all registration data
        // WHEN: Retrieving data for this registration
        await registerDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `REGISTRATION` `registration`' +
          ' INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all registration after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A registration data mapper instance
        // WHEN: Retrieving all registration data after an offset
        await registerDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `registration`.*, `hackathon`.`name`, ' +
          '`hackathon`.`start_time`, `hackathon`.`end_time`, `hackathon`.`base_pin`, ' +
          '`hackathon`.`active` FROM `REGISTRATION` `registration` ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid) OFFSET ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read n-many registrations',
      // @ts-ignore
      async () => {
        // GIVEN: A registration data mapper instance
        // WHEN: Retrieving n-many registrations data after an offset
        await registerDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `registration`.*, `hackathon`.`name`, ' +
          '`hackathon`.`start_time`, `hackathon`.`end_time`, `hackathon`.`base_pin`,' +
          ' `hackathon`.`active` FROM `REGISTRATION` `registration`' +
          ' INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid) LIMIT ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read registrations for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all registrations data for the given hackathon
        /* const result = */
        await registerDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `registration`.*, `hackathon`.`name`,' +
          ' `hackathon`.`start_time`, `hackathon`.`end_time`, `hackathon`.`base_pin`,' +
          ' `hackathon`.`active` FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` ' +
          '`hackathon` ON (registration.hackathon = hackathon.uid) WHERE (hackathon.uid = ?);';
        const expectedParams = [hackathonUid];
        const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read registrations for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all registrations data for the given hackathon
        await registerDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `registration`.*, `hackathon`.`name`, ' +
          '`hackathon`.`start_time`, `hackathon`.`end_time`, `hackathon`.`base_pin`,' +
          ' `hackathon`.`active` FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` ' +
          '`hackathon` ON (registration.hackathon = hackathon.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Registration count', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to count all registrations', async () => {
      // GIVEN: A registration data mapper instance
      // WHEN: Counting registration data
      await registerDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "registration_count" FROM `REGISTRATION`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
    // @ts-ignore
    it('generates the correct sql to count all registrations by hackathon', async () => {
      // GIVEN: A hackathon to read registrations for
      const hackathonUid = 'test uid';
      // WHEN: Counting registration data
      await registerDataMapper.getCount({
        byHackathon: true,
        hackathon: hackathonUid,
      });

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "registration_count" FROM `REGISTRATION` WHERE (hackathon = ?);';
      const expectedParams = [hackathonUid];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Registration insert', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });

    it('inserts the registration', async () => {
      // GIVEN: A registration to insert
      const registration = validRegistration;
      // WHEN: Retrieving number of events
      await registerDataMapper.insert(registration);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `REGISTRATION` (`firstname`, `lastname`, `gender`, ' +
        '`shirt_size`, `travel_reimbursement`, `first_hackathon`, `university`, `email`, ' +
        '`academic_year`, `major`, `phone`, `race`, `coding_experience`, `uid`, ' +
        '`eighteenBeforeEvent`, `mlh_coc`, `mlh_dcp`, `referral`, `project`, `expectations`, ' +
        '`veteran`, `time`, `submitted`, `interests`, `hackathon`) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
      const expectedParams = [
        validRegistration.firstname,
        validRegistration.lastname,
        validRegistration.gender,
        validRegistration.shirt_size,
        validRegistration.travel_reimbursement,
        validRegistration.first_hackathon,
        validRegistration.university,
        validRegistration.email,
        validRegistration.academic_year,
        validRegistration.major,
        validRegistration.phone,
        validRegistration.race,
        validRegistration.coding_experience,
        validRegistration.uid,
        validRegistration.eighteenBeforeEvent,
        validRegistration.mlh_coc,
        validRegistration.mlh_dcp,
        validRegistration.referral,
        validRegistration.project,
        validRegistration.expectations,
        validRegistration.veteran,
        validRegistration.time,
        validRegistration.submitted,
        validRegistration.interests,
        'test uid',
      ];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    // @ts-ignore
    it('fails to insert an invalid registration', async () => {
      // GIVEN: A registration to insert
      const registration = new Registration({
        academicYear: AcademicYear.FRESHMAN,
        allergies: null,
        codingExperience: CodingExperience.NONE,
        dietaryRestriction: null,
        eighteenBeforeEvent: true,
        email: 'test@email.com',
        ethnicity: 'test ethnicity',
        expectations: 'test expectations',
        firstHackathon: true,
        firstName: '',
        gender: Gender.NODISCLOSE,
        lastName: 'test last name',
        major: 'test major',
        mlhcoc: true,
        mlhdcp: true,
        phone: '1234567890',
        projectDesc: 'test description',
        referral: 'test referral',
        resume: null,
        shirtSize: ShirtSize.MEDIUM,
        travelReimbursement: false,
        uid: 'test uid',
        university: 'test university',
        veteran: VeteranOptions.NODISCLOSE,
        time: Date.now(),
        submitted: true,
        interests: 'test interests',
      });
      // WHEN: Adding an invalid registration
      try {
        await registerDataMapper.insert(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid firstname
        expect(error.body.message)
          .to
          .equal('data.firstname should NOT be shorter than 1 characters');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Registration delete', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('causes the registration to get deleted', async () => {
      // GIVEN: A registration with a valid ID
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Deleting this registration
      await registerDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `REGISTRATION` WHERE (uid = ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Registration update', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('updates the registration', async () => {
      // GIVEN: A registration to update
      const registration = validRegistration;
      validRegistration.hackathon = 'test uid';
      // WHEN: Updating the registration
      await registerDataMapper.update(registration);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `REGISTRATION` SET `firstname` = ?, `lastname` = ?, `gender` = ?, ' +
        '`shirt_size` = ?, `travel_reimbursement` = ?, `first_hackathon` = ?, `university` = ?, ' +
        '`email` = ?, `academic_year` = ?, `major` = ?, `phone` = ?, `race` = ?, `coding_experience` = ?, ' +
        '`uid` = ?, `eighteenBeforeEvent` = ?, `mlh_coc` = ?, `mlh_dcp` = ?, `referral` = ?, `project` = ?, ' +
        '`expectations` = ?, `veteran` = ?, `time` = ?, `submitted` = ?, `interests` = ?, `hackathon` = ? ' +
        'WHERE (uid = ?) AND (hackathon = ?);';
      const expectedParams = [
        validRegistration.firstname,
        validRegistration.lastname,
        validRegistration.gender,
        validRegistration.shirt_size,
        validRegistration.travel_reimbursement,
        validRegistration.first_hackathon,
        validRegistration.university,
        validRegistration.email,
        validRegistration.academic_year,
        validRegistration.major,
        validRegistration.phone,
        validRegistration.race,
        validRegistration.coding_experience,
        validRegistration.uid,
        validRegistration.eighteenBeforeEvent,
        validRegistration.mlh_coc,
        validRegistration.mlh_dcp,
        validRegistration.referral,
        validRegistration.project,
        validRegistration.expectations,
        validRegistration.veteran,
        validRegistration.time,
        validRegistration.submitted,
        validRegistration.interests,
        validRegistration.hackathon,
        validRegistration.id,
        validRegistration.hackathon,
      ];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .second();
      verify(mysqlUowMock.query(anything(), anything(), anything())).twice();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    // @ts-ignore
    it('fails to update an invalid registration', async () => {
      // GIVEN: A registration to update
      const registration = new Registration({
        academicYear: AcademicYear.FRESHMAN,
        allergies: null,
        codingExperience: CodingExperience.NONE,
        dietaryRestriction: null,
        eighteenBeforeEvent: true,
        email: 'test@email.com',
        ethnicity: 'test ethnicity',
        expectations: 'test expectations',
        firstHackathon: true,
        firstName: '',
        gender: Gender.NODISCLOSE,
        lastName: 'test last name',
        major: 'test major',
        mlhcoc: true,
        mlhdcp: true,
        phone: '1234567890',
        projectDesc: 'test description',
        referral: 'test referral',
        resume: null,
        shirtSize: ShirtSize.MEDIUM,
        travelReimbursement: false,
        uid: 'test uid',
        university: 'test university',
        veteran: VeteranOptions.NODISCLOSE,
        time: Date.now(),
        submitted: false,
        interests: 'test interests',
      });
      // WHEN: Updating an invalid registration
      try {
        await registerDataMapper.update(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid firstname
        expect(error.body.message)
          .to
          .equal('data.firstname should NOT be shorter than 1 characters');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Registration submit', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('submits the registration', async () => {
      // GIVEN: Registration to submit
      const registration = validRegistration;
      // WHEN: Registration is submitted
      await registerDataMapper.submit(registration);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `REGISTRATION` SET `submitted` = ? WHERE (uid = ?) AND (hackathon = ?);';
      const expectedParams = [true, validRegistration.uid, 'test uid'];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Registration read current', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to get the current registration', async () => {
      // GIVEN: A valid registration ID
      const uid = 'test registration';
      // WHEN: The current registration version is retrieved
      await registerDataMapper.getCurrent(uid);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT registration.*, registration.pin - hackathon.base_pin AS "pin" FROM `REGISTRATION` `registration`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid and hackathon.active = 1)' +
        ' WHERE (registration.uid= ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    it(
      'generates the correct sql to get the current registration with specific fields',
    // @ts-ignore
      async () => {
        // GIVEN: A valid registration ID
        const uid = 'test registration';
        // WHEN: The current registration version is retrieved
        await registerDataMapper.getCurrent(uid, { fields: ['firstname'] });
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT firstname, registration.pin - hackathon.base_pin AS "pin" FROM `REGISTRATION` `registration`' +
          ' INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid and hackathon.active = 1)' +
          ' WHERE (registration.uid= ?);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Registration get stats', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to get the current registration statistics', async () => {
      // GIVEN: A registration data mapper
      // WHEN: The registration statistics are retrieved
      await registerDataMapper.getRegistrationStats();
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT "academic_year" AS "CATEGORY", academic_year AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' GROUP BY academic_year UNION (SELECT "coding_experience" AS "CATEGORY", coding_experience AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' GROUP BY coding_experience) UNION (SELECT "dietary_restriction" AS "CATEGORY", dietary_restriction AS "OPTION",' +
        ' COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY dietary_restriction) UNION (SELECT "travel_reimbursement" AS "CATEGORY",' +
        ' travel_reimbursement AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY travel_reimbursement)' +
        ' UNION (SELECT "race" AS "CATEGORY", race AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY race)' +
        ' UNION (SELECT "shirt_size" AS "CATEGORY", shirt_size AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY shirt_size)' +
        ' UNION (SELECT "gender" AS "CATEGORY", gender AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY gender)' +
        ' UNION (SELECT "first_hackathon" AS "CATEGORY", first_hackathon AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY first_hackathon)' +
        ' UNION (SELECT "veteran" AS "CATEGORY", veteran AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY veteran);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    // @ts-ignore
    it('generates the correct sql to get the registration statistics by hackathon', async () => {
      // GIVEN: A registration data mapper
      // WHEN: The registration statistics are retrieved
      const hackathonUid = 'test hackathon';
      await registerDataMapper.getRegistrationStats({
        byHackathon: true,
        hackathon: hackathonUid,
      });
      // THEN: Generated SQL matches the expectation
      const expectedSQL =
        'SELECT "academic_year" AS "CATEGORY", academic_year AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?)' +
        ' GROUP BY academic_year UNION (SELECT "coding_experience" AS "CATEGORY", coding_experience AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?)' +
        ' GROUP BY coding_experience) UNION (SELECT "dietary_restriction" AS "CATEGORY", dietary_restriction AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?) GROUP BY dietary_restriction)' +
        ' UNION (SELECT "travel_reimbursement" AS "CATEGORY", travel_reimbursement AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?)' +
        ' GROUP BY travel_reimbursement) UNION (SELECT "race" AS "CATEGORY", race AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?) GROUP BY race)' +
        ' UNION (SELECT "shirt_size" AS "CATEGORY", shirt_size AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?) ' +
        'GROUP BY shirt_size) UNION (SELECT "gender" AS "CATEGORY", gender AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?) GROUP BY gender)' +
        ' UNION (SELECT "first_hackathon" AS "CATEGORY", first_hackathon AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?)' +
        ' GROUP BY first_hackathon) UNION (SELECT "veteran" AS "CATEGORY", veteran AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = ?) GROUP BY veteran);';
      const expectedParams = [hackathonUid, hackathonUid, hackathonUid, hackathonUid, hackathonUid, hackathonUid, hackathonUid, hackathonUid, hackathonUid];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Registration get email from uid', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      registerDataMapper = new RegisterDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to get the email from registrtation', async () => {
      // GIVEN: A valid registration ID
      const uid = 'test registration';
      // WHEN: The current registration version is retrieved
      await registerDataMapper.getEmailByUid(uid);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT `email` FROM `REGISTRATION` WHERE (uid = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
