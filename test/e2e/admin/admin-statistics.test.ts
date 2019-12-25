import * as firebase from 'firebase';
import _ from 'lodash';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { IUserStatistics } from '../../../src/models/admin/statistics/index';
import { Event } from '../../../src/models/event/event';
import { ExtraCreditAssignment } from '../../../src/models/extra-credit/extra-credit-assignment';
import { PreRegistration } from '../../../src/models/register/pre-registration';
import { Registration } from '../../../src/models/register/registration';
import { Rsvp } from '../../../src/models/RSVP/rsvp';
import { RfidAssignment } from '../../../src/models/scanner/rfid-assignment';
import { Scan } from '../../../src/models/scanner/scan';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';

let listener: firebase.Unsubscribe;
let firebaseUser: firebase.User;

function login(email: string, password: string): Promise<firebase.User> {
  if (firebaseUser) {
    return new Promise(resolve => resolve(firebaseUser));
  }
  return new Promise((resolve, reject) => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth()
      .onAuthStateChanged((user) => {
        if (user) {
          firebaseUser = user;
          resolve(user);
        }
      });
  });
}

function loginRegular() {
  return login('test@email.com', 'password');
}

function loginAdmin() {
  return login('admin@email.com', 'password');
}

@suite('INTEGRATION TEST: Admin Statistics')
class AdminStatisticsIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
  }

  public static async after() {
    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }
  protected static readonly registerTableName = 'REGISTRATION';
  protected static readonly rsvpTableName = 'RSVP';
  protected static readonly eventsTableName = 'EVENTS';
  protected static readonly locationsTableName = 'LOCATIONS';
  protected static readonly scansTableName = 'SCANS';
  protected static readonly rfidTableName = 'RFID_ASSIGNMENTS';
  protected static readonly ecClassesTableName = 'EXTRA_CREDIT_CLASSES';
  protected static readonly ecAssignmentsTableName = 'EXTRA_CREDIT_ASSIGNMENT';
  protected static readonly preregisterTableName = 'PRE_REGISTRATION';
  protected static readonly hackathonTableName = 'HACKATHON';
  protected static readonly attendancetableName = 'ATTENDANCE';

  protected readonly apiEndpoint = '/v2/admin/data?type';

  @test('successfully gets count of preregistered users for current active hackathon')
  @slow(1500)
  public async getPreregistrationCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the preregistration count
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=preregistration_count`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Preregistration count is returned
    await this.verifyPreregistrationCount(res.body.body.data);
  }

  @test('successfully gets all RSVP\'d users')
  @slow(1500)
  public async getRSVPUsersSuccessfully() {
    // GIVEN: API
    // WHEN: Getting RSVP'd user
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=rsvp`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: RSVP'd users are returned
    await this.verifyRSVPUsers(res.body.body.data);
  }

  @test('successfully gets all attendance data by event')
  @slow(1500)
  public async getAttendanceDataByEventSuccessfully() {
    // GIVEN: API
    // WHEN: Getting attendance data by event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: TestData.validEvent().uid,
      allHackathons: false,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=attendance&aggregator=event`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Attendance data by event is returned
    await this.verifyAttendanceDataByEvent(res.body.body.data);
  }

  @test('successfully gets all attendance data by user')
  @slow(1500)
  public async getAttendanceDataByUserSuccessfully() {
    // GIVEN: API
    // WHEN: Getting attendance data by user
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: TestData.validRegistration().uid,
      allHackathons: false,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=attendance&aggregator=user`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Attendance data by user is returned
    await this.verifyAttendanceDataByUser(res.body.body.data);
  }

  @test('successfully gets all attendance data')
  @slow(1500)
  public async getAttendanceDataSuccessfully() {
    // GIVEN: API
    // WHEN: Getting attendance data
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=attendance`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Attendance data is returned
    await this.verifyAttendanceData(res.body.body.data);
  }

  @test('successfully gets all event scans')
  @slow(1500)
  public async getEventScansSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all event scans
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=scans`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All event scans are returned
    await this.verifyEventScans(res.body.body.data);
  }

  @test('successfully gets all extra credit assignments')
  @slow(1500)
  public async getExtraCreditAssignmentsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all extra credit assignments
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=extra_credit_assignments`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All extra credit assignments are returned
    await this.verifyExtraCreditAssignments(res.body.body.data);
  }

  @test('successfully gets all preregistered users')
  @slow(1500)
  public async getPreregisteredUsersSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all preregistered users
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=preregistration`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All preregistered users are returned
    await this.verifyPreRegisteredUsers(res.body.body.data);
  }

  @test('successfully gets all user data')
  @slow(1500)
  public async getUserDataSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all user data
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=registration_stats`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All user data is returned
    await this.verifyUserData(res.body.body.data);
  }

  @test('successfully gets all wristband assignments')
  @slow(1500)
  public async getWristbandAssignmentsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all wristband assignments
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=wid_assignments`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All user data is returned
    await this.verifyWristbandAssignments(res.body.body.data);
  }

  @test('successfully gets number of RSVP\'d users')
  @slow(1500)
  public async getRSVPCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting number of RSVP'd users
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=rsvp_count`)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Number of RSVP'd users is returned
    await this.verifyRSVPCount(res.body.body.data);
  }

  @test('successfully gets number of users by interaction type')
  @slow(1500)
  public async getUserCountByInteractionTypeSuccessfully() {
    // GIVEN: API
    // WHEN: Getting number users by interaction type
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=stats_count`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Number of users by interaction type is returned
    await this.verifyUserCountByInteractionType(res.body.body.data);
  }

  @test('successfully gets number of users for different registration fields')
  @slow(1500)
  public async getRegistrationCategoryDataCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting number users for different registration categories
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=registration_category_count`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Number of users for different registration categories is returned
    await this.verifyRegistrationCategoryDataCount(res.body.body.data);
  }

  private async verifyPreregistrationCount(count: number) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.preregisterTableName)
      .field('COUNT(uid)', 'count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await AdminStatisticsIntegrationTest.mysqlUow.query<object>(
      query.text,
      query.values,
    ) as object[];
    this.expect(result[1]).to.deep.equal(count[1]);
  }

  private async verifyRSVPUsers(users: Rsvp) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.rsvpTableName, 'rsvp')
      .field('rsvp.*')
      .field('hackathon.uid', 'hackathon')
      .join(AdminStatisticsIntegrationTest.hackathonTableName,
            'hackathon',
            'rsvp.hackathon = hackathon.uid')
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<Rsvp>(
      query.text,
      query.values,
    );
    this.expect(users).to.deep.equal(result);
  }

  private verifyAttendanceDataByEvent(data: any) {
    const uid = TestData.validEvent().uid as string;
    const result = {
      'test event uid': {
        ...new Event(TestData.validEvent()).cleanRepresentation,
        attendees: [{ ...new Registration(TestData.validRegistration()).cleanRepresentation }],
      },
    };

    result[uid].event_uid = result[uid].uid;
    result[uid].event_start_time = result[uid].event_start_time.toString();
    result[uid].event_end_time = result[uid].event_end_time.toString();
    result[uid].attendees[0].user_uid = result[uid].attendees[0].uid;
    result[uid].attendees[0].pin = data[uid].attendees[0].pin;
    result[uid].attendees[0].hackathon = IntegrationTest.activeHackathon.uid;

    delete result[uid].uid;
    delete result[uid].event_location;
    delete result[uid].hackathon;
    delete result[uid].attendees[0].uid;
    delete result[uid].attendees[0].eighteenBeforeEvent;
    delete result[uid].attendees[0].mlh_coc;
    delete result[uid].attendees[0].mlh_dcp;
    delete result[uid].attendees[0].submitted;
    delete result[uid].attendees[0].time;
    this.expect(data).to.deep.equal(result);
  }

  private verifyAttendanceDataByUser(data: any) {
    const uid = TestData.validRegistration().uid as string;
    const result = {
      [uid]: {
        ...new Registration(TestData.validRegistration()).cleanRepresentation,
        events: [{ ...new Event(TestData.validEvent()).cleanRepresentation }],
      },
    };

    // @ts-ignore
    result[uid].user_uid = result[uid].uid;
    result[uid].pin = data[uid].pin;
    result[uid].hackathon = IntegrationTest.activeHackathon.uid;
    // @ts-ignore
    result[uid].events[0].event_uid = result[uid].events[0].uid;
    // @ts-ignore
    result[uid].events[0].event_start_time = result[uid].events[0].event_start_time.toString();
    // @ts-ignore
    result[uid].events[0].event_end_time = result[uid].events[0].event_end_time.toString();

    delete result[uid].uid;
    delete result[uid].mlh_coc;
    delete result[uid].mlh_dcp;
    delete result[uid].submitted;
    delete result[uid].eighteenBeforeEvent;
    delete result[uid].time;
    delete result[uid].events[0].uid;
    delete result[uid].events[0].event_location;
    delete result[uid].events[0].hackathon;
    this.expect(data).to.deep.equal(result);
  }

  private async verifyAttendanceData(data: any) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.attendancetableName, 'attendance')
      .join(
        AdminStatisticsIntegrationTest.registerTableName,
        'registration',
        'attendance.user_uid = registration.uid',
      )
      .distinct()
      .where('hackathon_id = ?', IntegrationTest.activeHackathon.uid)
      .where('registration.hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat('');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<object>(
      query.text,
      query.values,
    ) as object[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyEventScans(data: Scan[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.scansTableName, 'scans')
      .join(
        AdminStatisticsIntegrationTest.hackathonTableName,
        'hackathon',
        'scans.hackathon = hackathon.uid',
      )
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<Scan>(
      query.text,
      query.values,
    ) as Scan[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyExtraCreditAssignments(data: ExtraCreditAssignment[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.ecAssignmentsTableName)
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<ExtraCreditAssignment>(
      query.text,
      query.values,
    ) as ExtraCreditAssignment[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyPreRegisteredUsers(data: PreRegistration[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.preregisterTableName)
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<PreRegistration>(
      query.text,
      query.values,
    ) as PreRegistration[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyUserData(data: IUserStatistics[]) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .distinct()
      .field('pre_reg.uid', 'pre_uid')
      .field('reg.*')
      .field('reg.pin - hackathon.base_pin', 'pin')
      .field('hackathon.name')
      .field('hackathon.start_time')
      .field('hackathon.end_time')
      .field('hackathon.base_pin')
      .field('hackathon.active')
      .field('rsvp.user_id')
      .field('rsvp.rsvp_time')
      .field('rsvp.rsvp_status')
      .field('rfid.user_uid')
      .from(AdminStatisticsIntegrationTest.preregisterTableName, 'pre_reg')
      .right_join(AdminStatisticsIntegrationTest.registerTableName, 'reg', 'pre_reg.email = reg.email')
      .join(AdminStatisticsIntegrationTest.hackathonTableName, 'hackathon', 'reg.hackathon = hackathon.uid')
      .left_join(AdminStatisticsIntegrationTest.rsvpTableName, 'rsvp', 'reg.uid = rsvp.user_id')
      .left_join(AdminStatisticsIntegrationTest.rfidTableName, 'rfid', 'reg.uid = rfid.user_uid')
      .where('reg.hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<IUserStatistics>(
      query.text,
      query.values,
    ) as IUserStatistics[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyWristbandAssignments(data: RfidAssignment[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.rfidTableName, 'wid_assignments')
      .join(
        AdminStatisticsIntegrationTest.hackathonTableName,
        'hackathon',
        'wid_assignments.hackathon = hackathon.uid',
      )
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<RfidAssignment>(
      query.text,
      query.values,
    );
    this.expect(result).to.deep.equal(data);
  }

  private async verifyRSVPCount(count: number) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.rsvpTableName)
      .field('COUNT(user_id)', 'count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await AdminStatisticsIntegrationTest.mysqlUow.query<object>(
      query.text,
      query.values,
    ) as object[];
    this.expect(result[1]).to.deep.equal(count[1]);
  }

  private async verifyUserCountByInteractionType(count: number[]) {
    const preregisterCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.preregisterTableName)
      .field('COUNT(uid)', 'preregistration_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const registerCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.registerTableName)
      .field('COUNT(uid)', 'registration_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const rsvpCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.rsvpTableName)
      .field('COUNT(user_id)', 'rsvp_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const scannerCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.rfidTableName)
      .field('COUNT(rfid_uid)', 'checkin_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(preregisterCountQuery, 'a')
      .join(registerCountQuery, 'b')
      .join(rsvpCountQuery, 'c')
      .join(scannerCountQuery, 'd')
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(result).to.deep.equal(count);
  }

  private async verifyRegistrationCategoryDataCount(count: number[]) {
    const columnNames = [
      'academic_year',
      'coding_experience',
      'dietary_restriction',
      'travel_reimbursement',
      'race',
      'shirt_size',
      'gender',
      'first_hackathon',
      'veteran',
    ];
    let queryBuilder;
    for (const name of columnNames) {
      queryBuilder = !queryBuilder ?
        this.getSelectQueryForOptionName(name) :
        queryBuilder.union(this.getSelectQueryForOptionName(name));
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(result).to.deep.equal(count);
  }

  private getSelectQueryForOptionName(fieldname: string): squel.Select {
    return squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.registerTableName)
      .field(`"${fieldname}"`, 'CATEGORY')
      .field(fieldname, 'OPTION')
      .field('COUNT(*)', 'COUNT')
      .join(
        AdminStatisticsIntegrationTest.hackathonTableName,
        'hackathon',
        `hackathon.uid = ${AdminStatisticsIntegrationTest.registerTableName}.hackathon`,
      )
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .group(fieldname);
  }
}
