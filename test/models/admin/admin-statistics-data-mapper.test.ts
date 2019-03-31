// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, when } from 'ts-mockito';
import { IAdminStatisticsDataMapper } from '../../../src/models/admin/statistics';
import { AdminStatisticsDataMapperImpl } from '../../../src/models/admin/statistics/admin-statistics-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import {
  IPreRegisterDataMapper,
  IRegisterDataMapper,
} from '../../../src/models/register';
import { PreRegisterDataMapperImpl } from '../../../src/models/register/pre-register-data-mapper-impl';
import { RegisterDataMapperImpl } from '../../../src/models/register/register-data-mapper-impl';
import { IRsvpDataMapper } from '../../../src/models/rsvp';
import { RsvpDataMapperImpl } from '../../../src/models/rsvp/RSVP-data-mapper-impl';
import { IScannerDataMapper } from '../../../src/models/scanner';
import { ScannerDataMapperImpl } from '../../../src/models/scanner/scanner-data-mapper-impl';
import { IFirebaseAuthService } from '../../../src/services/auth/auth-types';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let registerDataMapper: IRegisterDataMapper;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let preRegisterDataMapper: IPreRegisterDataMapper;
let rsvpDataMapper: IRsvpDataMapper;
let scannerDataMapper: IScannerDataMapper;
let authService: IFirebaseAuthService;
let adminStatisticsDataMapper: IAdminStatisticsDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);

const acl: IAcl = new RBAC();

describe('TEST: Admin Statistics data mapper', () => {
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
    registerDataMapper = new RegisterDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    preRegisterDataMapper = new PreRegisterDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    rsvpDataMapper = new RsvpDataMapperImpl(acl, mysqlUow, activeHackathonDataMapper, new Logger());
    scannerDataMapper = new ScannerDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    authService = Substitute.for<IFirebaseAuthService>();
  });

  describe('TEST: Get user count by category', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Admin Statistiics Data Mapper
      adminStatisticsDataMapper = new AdminStatisticsDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        preRegisterDataMapper,
        registerDataMapper,
        rsvpDataMapper,
        scannerDataMapper,
        activeHackathonDataMapper,
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });

    it('generates the correct sql to read the user counts by category', async () => {
      // GIVEN: An admin statistics data mapper
      // WHEN: Retrieving the number of users for each category
      await adminStatisticsDataMapper.getUserCountByCategory();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM (SELECT COUNT(uid) AS "preregistration_count" FROM ' +
        '`PRE_REGISTRATION`) `a` INNER JOIN (SELECT COUNT(uid) AS "registration_count" FROM ' +
        '`REGISTRATION`) `b` INNER JOIN (SELECT COUNT(user_id) AS "rsvp_count" FROM `rsvp`) `c`' +
        ' INNER JOIN (SELECT COUNT(rfid_uid) AS "checkin_count" FROM `RFID_ASSIGNMENTS`) `d`;';
      const expectedParams = [];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    it(
      'generates the correct sql to read the user counts by category for the current hackathon',
      async () => {
        // GIVEN: An admin statistics data mapper
        // WHEN: Retrieving the number of users for each category
        await adminStatisticsDataMapper.getUserCountByCategory({ byHackathon: true });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM (SELECT COUNT(uid) AS "preregistration_count" FROM ' +
          '`PRE_REGISTRATION`) `a` INNER JOIN (SELECT COUNT(uid) AS "registration_count" FROM ' +
          '`REGISTRATION` WHERE (hackathon = ?)) `b` INNER JOIN (SELECT COUNT(user_id) AS "rsvp_count"' +
          ' FROM `rsvp` WHERE (hackathon = ?)) `c` INNER JOIN (SELECT COUNT(rfid_uid) AS "checkin_count"' +
          ' FROM `RFID_ASSIGNMENTS` WHERE (hackathon = ?)) `d`;';
        const expectedParams = ['test uid', 'test uid', 'test uid'];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read the user counts by category for the specific hackathon',
      async () => {
        // GIVEN: An admin statistics data mapper
        // WHEN: Retrieving the number of users for each category
        await adminStatisticsDataMapper.getUserCountByCategory({
          byHackathon: true,
          hackathon: 'provided test uid',
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM (SELECT COUNT(uid) AS "preregistration_count" FROM ' +
          '`PRE_REGISTRATION`) `a` INNER JOIN (SELECT COUNT(uid) AS "registration_count" FROM ' +
          '`REGISTRATION` WHERE (hackathon = ?)) `b` INNER JOIN (SELECT COUNT(user_id) AS "rsvp_count"' +
          ' FROM `rsvp` WHERE (hackathon = ?)) `c` INNER JOIN (SELECT COUNT(rfid_uid) AS "checkin_count"' +
          ' FROM `RFID_ASSIGNMENTS` WHERE (hackathon = ?)) `d`;';
        const expectedParams = ['provided test uid', 'provided test uid', 'provided test uid'];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Get all user data', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Admin Statistiics Data Mapper
      adminStatisticsDataMapper = new AdminStatisticsDataMapperImpl(
        acl,
        authService,
        mysqlUow,
        preRegisterDataMapper,
        registerDataMapper,
        rsvpDataMapper,
        scannerDataMapper,
        activeHackathonDataMapper,
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });

    it('generates the correct sql to read all user data', async () => {
      // GIVEN: An admin statistics data mapper
      // WHEN: Retrieving all user data
      await adminStatisticsDataMapper.getAllUserData();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT DISTINCT pre_reg.uid AS "pre_uid", reg.*, ' +
        'reg.pin - hackathon.base_pin AS "pin", hackathon.name, hackathon.start_time, ' +
        'hackathon.end_time, hackathon.base_pin, hackathon.active, rsvp.user_id, ' +
        'rsvp.rsvp_time, rsvp.rsvp_status, rfid.user_uid FROM `PRE_REGISTRATION` `pre_reg` ' +
        'RIGHT JOIN `REGISTRATION` `reg` ON (pre_reg.email = reg.email) ' +
        'INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid) ' +
        'LEFT JOIN `rsvp` `rsvp` ON (reg.uid = rsvp.user_id) LEFT JOIN `RFID_ASSIGNMENTS` `rfid` ' +
        'ON (reg.uid = rfid.user_uid);';
      const expectedParams = [];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    it(
      'generates the correct sql to read all user data for the current hackathon',
      async () => {
        // GIVEN: An admin statistics data mapper
        // WHEN: Retrieving the number of users for each category
        await adminStatisticsDataMapper.getAllUserData({ byHackathon: true });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT pre_reg.uid AS "pre_uid", reg.*, ' +
          'reg.pin - hackathon.base_pin AS "pin", hackathon.name, hackathon.start_time, ' +
          'hackathon.end_time, hackathon.base_pin, hackathon.active, rsvp.user_id, rsvp.rsvp_time, ' +
          'rsvp.rsvp_status, rfid.user_uid FROM `PRE_REGISTRATION` `pre_reg` ' +
          'RIGHT JOIN `REGISTRATION` `reg` ON (pre_reg.email = reg.email) ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid) ' +
          'LEFT JOIN `rsvp` `rsvp` ON (reg.uid = rsvp.user_id) LEFT JOIN `RFID_ASSIGNMENTS` `rfid` ' +
          'ON (reg.uid = rfid.user_uid) WHERE (reg.hackathon = ?);';
        const expectedParams = ['test uid'];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read all user data for the specific hackathon',
      async () => {
        // GIVEN: An admin statistics data mapper
        // WHEN: Retrieving the number of users for each category
        await adminStatisticsDataMapper.getAllUserData({
          byHackathon: true,
          hackathon: 'provided test uid',
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT pre_reg.uid AS "pre_uid", reg.*, ' +
          'reg.pin - hackathon.base_pin AS "pin", hackathon.name, hackathon.start_time, ' +
          'hackathon.end_time, hackathon.base_pin, hackathon.active, rsvp.user_id, rsvp.rsvp_time, ' +
          'rsvp.rsvp_status, rfid.user_uid FROM `PRE_REGISTRATION` `pre_reg` ' +
          'RIGHT JOIN `REGISTRATION` `reg` ON (pre_reg.email = reg.email) ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid) ' +
          'LEFT JOIN `rsvp` `rsvp` ON (reg.uid = rsvp.user_id) LEFT JOIN `RFID_ASSIGNMENTS` `rfid` ' +
          'ON (reg.uid = rfid.user_uid) WHERE (reg.hackathon = ?);';
        const expectedParams = ['provided test uid'];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read certain number of user data',
      async () => {
        // GIVEN: An admin statistics data mapper
        // WHEN: Retrieving the number of users for each category
        await adminStatisticsDataMapper.getAllUserData({ count: 1 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT pre_reg.uid AS "pre_uid", reg.*, ' +
          'reg.pin - hackathon.base_pin AS "pin", hackathon.name, hackathon.start_time,' +
          ' hackathon.end_time, hackathon.base_pin, hackathon.active, rsvp.user_id, ' +
          'rsvp.rsvp_time, rsvp.rsvp_status, rfid.user_uid FROM `PRE_REGISTRATION` `pre_reg` ' +
          'RIGHT JOIN `REGISTRATION` `reg` ON (pre_reg.email = reg.email) ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid)' +
          ' LEFT JOIN `rsvp` `rsvp` ON (reg.uid = rsvp.user_id) LEFT JOIN `RFID_ASSIGNMENTS` `rfid` ' +
          'ON (reg.uid = rfid.user_uid) LIMIT ?;';
        const expectedParams = [1];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read certain number of user data with an offset',
      async () => {
        // GIVEN: An admin statistics data mapper
        // WHEN: Retrieving the number of users for each category
        await adminStatisticsDataMapper.getAllUserData({ count: 1, startAt: 5 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT pre_reg.uid AS "pre_uid", reg.*, ' +
          'reg.pin - hackathon.base_pin AS "pin", hackathon.name, hackathon.start_time,' +
          ' hackathon.end_time, hackathon.base_pin, hackathon.active, rsvp.user_id, ' +
          'rsvp.rsvp_time, rsvp.rsvp_status, rfid.user_uid FROM `PRE_REGISTRATION` `pre_reg` ' +
          'RIGHT JOIN `REGISTRATION` `reg` ON (pre_reg.email = reg.email) ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid)' +
          ' LEFT JOIN `rsvp` `rsvp` ON (reg.uid = rsvp.user_id) LEFT JOIN `RFID_ASSIGNMENTS` `rfid` ' +
          'ON (reg.uid = rfid.user_uid) LIMIT ? OFFSET ?;';
        const expectedParams = [1, 5];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });
});
