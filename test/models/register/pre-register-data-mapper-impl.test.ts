import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { IPreRegisterDataMapper } from '../../../src/models/register';
import { PreRegisterDataMapperImpl } from '../../../src/models/register/pre-register-data-mapper-impl';
import { PreRegistration } from '../../../src/models/register/pre-registration';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let preRegisterDataMapper: IPreRegisterDataMapper;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();
const validPreregistration = new PreRegistration({
  email: 'test@email.com',
  uid: 'test uid',
});
describe('TEST: Pre-register data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);

    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    // Configure Pre Register Data Mapper
    preRegisterDataMapper = new PreRegisterDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
  });
  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Pre-registration read', () => {
    it(
      'generates the correct sql to read a pre-registration based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving data for this pre-registration
        await preRegisterDataMapper.get(uid);

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` WHERE (uid= ?);';
        const expectedParams = [uid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read a pre-registration with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving a single field for this pre-registration
        await preRegisterDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `PRE_REGISTRATION` WHERE (uid= ?);';
        const expectedParams = [uid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Pre-registration read all', () => {
    // @ts-ignore
    it('generates the correct sql to read all pre-registrations', async () => {
      // GIVEN: A pre-registration data mapper instance
      // WHEN: Retrieving all pre-registration data
      await preRegisterDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all pre-registration after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration data mapper instance
        // WHEN: Retrieving all pre-registration data after an offset
        await preRegisterDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` OFFSET ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read n-many pre-registrations',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration data mapper instance
        // WHEN: Retrieving n-many pre-registrations data after an offset
        await preRegisterDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` LIMIT ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read pre-registrations for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read pre-registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all pre-registrations data for the given hackathon
        await preRegisterDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` WHERE (hackathon = ?);';
        const expectedParams = [hackathonUid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read pre-registrations for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read pre-registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all pre-registrations data for the given hackathon
        await preRegisterDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION`;';
        const expectedParams = [];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Pre-registration count', () => {
    // @ts-ignore
    it('generates the correct sql to count all pre-registrations', async () => {
      // GIVEN: A pre-registration data mapper instance
      // WHEN: Counting pre-registration data
      await preRegisterDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "preregistration_count" FROM `PRE_REGISTRATION`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Pre-registration insert', () => {
    // @ts-ignore
    it('inserts the pre-registration', async () => {
      // GIVEN: A pre-registration to insert
      const preregistration = validPreregistration;
      // WHEN: Inserting the pre-registration
      await preRegisterDataMapper.insert(preregistration);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `PRE_REGISTRATION` (`email`, `uid`, `hackathon`) VALUES (?, ?, ?);';
      const expectedParams = [preregistration.email, preregistration.uid, 'test uid'];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    // @ts-ignore
    it('fails to insert an invalid preregistration', async () => {
      // GIVEN: A pre-registration to insert
      const preregistration = new PreRegistration({
        email: 'invalid email',
        uid: 'test uid',
      });
      // WHEN: Adding an invalid pre-registration
      try {
        await preRegisterDataMapper.insert(preregistration);
      } catch (error) {
        // THEN: Error is thrown for invalid email
        expect(error.data.message).to.equal('data.email should match format "email"');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Pre-registration update', () => {
    // @ts-ignore
    it('updates the pre-registration', async () => {
      // GIVEN: A pre-registration to update
      const preregistration = validPreregistration;
      // WHEN: Updating the pre-registration
      await preRegisterDataMapper.update(preregistration);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `PRE_REGISTRATION` SET `email` = ?, `uid` = ? WHERE (uid = ?);';
      const expectedParams = [preregistration.email, preregistration.uid, preregistration.uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    // @ts-ignore
    it('fails to update an invalid pre-registration', async () => {
      // GIVEN: A pre-registration to update
      const preregistration = new PreRegistration({
        email: 'invalid email',
        uid: 'test uid',
      });
      // WHEN: Updating an invalid pre-registration
      try {
        await preRegisterDataMapper.update(preregistration);
      } catch (error) {
        // THEN: Error is thrown for invalid firstname
        expect(error.data.message).to.equal('data.email should match format "email"');
        return;
      }
      expect(false).to.equal(true);
    });
  });
});
