import * as firebase from 'firebase';
import _ from 'lodash';
import squel from 'squel';
import { CheckoutItems } from '../../lib/models/checkout-items/checkout-items';
import { ICheckoutItemsApiModel } from '../../src/models/checkout-items/checkout-items';
import { CheckoutObject, ICheckoutObjectApiModel } from '../../src/models/checkout-object/checkout-object';
import { Event, EventType, IEventApiModel } from '../../src/models/event/event';
import { ExtraCreditAssignment, IExtraCreditAssignmentApiModel } from '../../src/models/extra-credit/extra-credit-assignment';
import { ExtraCreditClass, IExtraCreditClassApiModel } from '../../src/models/extra-credit/extra-credit-class';
import { ILocationApiModel, Location } from '../../src/models/location/location';
import { IPreRegistrationApiModel, PreRegistration } from '../../src/models/register/pre-registration';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  IRegistrationApiModel,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../src/models/register/registration';
import { IRsvpApiModel, Rsvp } from '../../src/models/RSVP/rsvp';
import { IRfidAssignmentApiModel, RfidAssignment } from '../../src/models/scanner/rfid-assignment';
import { IRfidScanApiModel, Scan } from '../../src/models/scanner/scan';
import { IntegrationTest } from './integration-test';

export class TestData {
  public static readonly registerTableName = 'REGISTRATION';
  public static readonly rsvpTableName = 'RSVP';
  public static readonly eventsTableName = 'EVENTS';
  public static readonly locationsTableName = 'LOCATIONS';
  public static readonly scansTableName = 'SCANS';
  public static readonly rfidTableName = 'RFID_ASSIGNMENTS';
  public static readonly ecClassesTableName = 'EXTRA_CREDIT_CLASSES';
  public static readonly ecAssignmentsTableName = 'EXTRA_CREDIT_ASSIGNMENT';
  public static readonly preregisterTableName = 'PRE_REGISTRATION';
  public static readonly hackathonTableName = 'HACKATHON';
  public static readonly attendancetableName = 'ATTENDANCE';
  public static readonly checkoutTableName = 'CHECKOUT_DATA';
  public static readonly checkoutItemTableName = 'CHECKOUT_ITEMS';

  public static validRegistration(): IRegistrationApiModel {
    return {
      firstName: 'testFirstName',
      lastName: 'testLastName',
      gender: Gender.MALE,
      shirtSize: ShirtSize.MEDIUM,
      dietaryRestriction: 'test restriction',
      allergies: 'test allergy',
      travelReimbursement: false,
      firstHackathon: false,
      university: 'Test University',
      email: 'test@email.com',
      academicYear: AcademicYear.JUNIOR,
      major: 'test major',
      phone: '1234567890',
      resume: null,
      ethnicity: 'test ethnicity',
      codingExperience: CodingExperience.INTERMEDIATE,
      // The actual uid of test@email.com in firebase
      uid: 'N79Hnh4eq8Wapxvhn8jaX2I0kSq2',
      eighteenBeforeEvent: true,
      mlhcoc: true,
      mlhdcp: true,
      referral: 'test referral',
      projectDesc: 'test project',
      expectations: 'test expectations',
      veteran: VeteranOptions.NO,
      time: 0,
      submitted: false,
    };
  }

  public static validRsvp(): IRsvpApiModel {
    return {
      uid: this.validRegistration().uid,
      rsvp_time: 1,
      rsvp_status: true,
    };
  }

  public static validLocation(): ILocationApiModel {
    return {
      uid: 999,
      locationName: 'Test location',
    };
  }

  public static validEvent(): IEventApiModel {
    return {
      uid: 'test event uid',
      eventLocation: 999,
      eventStartTime: 1,
      eventEndTime: 4,
      eventTitle: 'Test Event',
      eventDescription: 'Test description',
      eventType: EventType.WORKSHOP,
    };
  }

  public static validRfidAssignment(): IRfidAssignmentApiModel {
    return {
      wid: 'test wid',
      uid: this.validRegistration().uid as string,
      time: 2,
    };
  }

  public static validScan(): IRfidScanApiModel {
    return {
      wid: this.validRfidAssignment().wid,
      scan_event: this.validEvent().uid as string,
      scan_time: 3,
      scan_location: 999,
    };
  }

  public static validExtraCreditClass(): IExtraCreditClassApiModel {
    return {
      uid: 5,
      class_name: 'test class',
    };
  }

  public static validExtraCreditAssignment(): IExtraCreditAssignmentApiModel {
    return {
      uid: this.validRegistration().uid as string,
      cid: 5,
    };
  }

  public static validPreRegistration(): IPreRegistrationApiModel {
    return {
      uid: this.validRegistration().uid,
      email: this.validRegistration().email,
    };
  }

  public static validCheckoutObject(): ICheckoutObjectApiModel {
    return {
      uid: 0,
      item_id: 0,
      user_id: 'test uid',
      checkout_time: 0,
      return_time: 0,
    };
  }

  public static validCheckoutItemObject(): ICheckoutItemsApiModel {
    return {
      name: 'test object',
      quantity: 0,
    };
  }

  public static async setup() {
    const testRegistration = new Registration(this.validRegistration());
    const registrationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.registerTableName)
      .setFieldsRows([testRegistration.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    registrationQuery.text = registrationQuery.text.concat(';');

    const testRsvp = new Rsvp(this.validRsvp());
    const rsvpQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.rsvpTableName)
      .setFieldsRows([testRsvp.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    rsvpQuery.text = rsvpQuery.text.concat(';');
    const testEvent = new Event(this.validEvent());
    const eventQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.eventsTableName)
      .setFieldsRows([testEvent.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    eventQuery.text = eventQuery.text.concat(';');

    const testLocation = new Location(this.validLocation());
    const locationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.locationsTableName)
      .setFieldsRows([testLocation.dbRepresentation])
      .toParam();
    locationQuery.text = locationQuery.text.concat(';');

    const testScan = new Scan(this.validScan());
    const scanQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.scansTableName)
      .setFieldsRows([testScan.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    scanQuery.text = scanQuery.text.concat(';');

    const testRfidAssignment = new RfidAssignment(this.validRfidAssignment());
    const rfidAssignmentQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.rfidTableName)
      .setFieldsRows([testRfidAssignment.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    rfidAssignmentQuery.text = rfidAssignmentQuery.text.concat(';');

    const testExtraCreditClass = new ExtraCreditClass(this.validExtraCreditClass());
    const extraCreditClassQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.ecClassesTableName)
      .setFieldsRows([testExtraCreditClass.dbRepresentation])
      .toParam();
    extraCreditClassQuery.text = extraCreditClassQuery.text.concat(';');

    const testExtraCreditAssignment = new ExtraCreditAssignment(this.validExtraCreditAssignment());
    const extraCreditAssignmentQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.ecAssignmentsTableName)
      .setFieldsRows([testExtraCreditAssignment.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    extraCreditAssignmentQuery.text = extraCreditAssignmentQuery.text.concat(';');

    const testPreRegistration = new PreRegistration(this.validPreRegistration());
    const preRegistrationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.preregisterTableName)
      .setFieldsRows([testPreRegistration.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    preRegistrationQuery.text = preRegistrationQuery.text.concat(';');

    const testCheckout = new CheckoutObject(this.validCheckoutObject());
    const checkoutQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('CHECKOUT_DATA')
      .setFieldsRows([testCheckout.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    checkoutQuery.text = checkoutQuery.text.concat(';');

    const testCheckoutItem = new CheckoutItems(this.validCheckoutItemObject());
    const checkoutItemQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('CHECKOUT_ITEMS')
      .setFieldsRows([testCheckoutItem.dbRepresentation])
      .set('uid', 'test uid')
      .toParam();
    checkoutItemQuery.text = checkoutItemQuery.text.concat(';');

    await IntegrationTest.mysqlUow.query(registrationQuery.text, registrationQuery.values);
    await IntegrationTest.mysqlUow.query(rsvpQuery.text, rsvpQuery.values);
    await IntegrationTest.mysqlUow.query(locationQuery.text, locationQuery.values);
    await IntegrationTest.mysqlUow.query(eventQuery.text, eventQuery.values);
    await IntegrationTest.mysqlUow.query(rfidAssignmentQuery.text, rfidAssignmentQuery.values);
    await IntegrationTest.mysqlUow.query(scanQuery.text, scanQuery.values);
    await IntegrationTest.mysqlUow.query(extraCreditClassQuery.text, extraCreditClassQuery.values);
    await IntegrationTest.mysqlUow.query(extraCreditAssignmentQuery.text, extraCreditAssignmentQuery.values);
    await IntegrationTest.mysqlUow.query(preRegistrationQuery.text, preRegistrationQuery.values);
    await IntegrationTest.mysqlUow.query(checkoutQuery.text, checkoutQuery.values);
    await IntegrationTest.mysqlUow.query(checkoutItemQuery.text, checkoutItemQuery.values);
  }

  public static async tearDown() {
    const registrationQuery = squel.delete()
      .from(this.registerTableName)
      .where('email = ?', this.validRegistration().email)
      .toParam();
    registrationQuery.text = registrationQuery.text.concat(';');
    const rsvpQuery = squel.delete()
      .from(this.rsvpTableName)
      .where('rsvp_time = ?', this.validRsvp().rsvp_time)
      .toParam();
    rsvpQuery.text = rsvpQuery.text.concat(';');
    const eventQuery = squel.delete()
      .from(this.eventsTableName)
      .where('event_title = ?', this.validEvent().eventTitle)
      .toParam();
    eventQuery.text = eventQuery.text.concat(';');
    const locationQuery = squel.delete()
      .from(this.locationsTableName)
      .where('uid = ?', this.validLocation().uid)
      .toParam();
    locationQuery.text = locationQuery.text.concat(';');
    const scanQuery = squel.delete()
      .from(this.scansTableName)
      .where('scan_event = ?', this.validScan().scan_event)
      .toParam();
    scanQuery.text = scanQuery.text.concat(';');
    const rfidAssignmentQuery = squel.delete()
      .from(this.rfidTableName)
      .where('time = ?', this.validRfidAssignment().time)
      .toParam();
    rfidAssignmentQuery.text = rfidAssignmentQuery.text.concat(';');
    const extraCreditClassQuery = squel.delete()
      .from(this.ecClassesTableName)
      .where('class_name = ?', this.validExtraCreditClass().class_name)
      .toParam();
    extraCreditClassQuery.text = extraCreditClassQuery.text.concat(';');
    const extraCreditAssignmentQuery = squel.delete()
      .from(this.ecAssignmentsTableName)
      .where('class_uid = ?', this.validExtraCreditAssignment().cid)
      .toParam();
    extraCreditAssignmentQuery.text = extraCreditAssignmentQuery.text.concat(';');
    const preRegistrationQuery = squel.delete()
      .from(this.preregisterTableName)
      .where('email = ?', this.validPreRegistration().email)
      .toParam();
    preRegistrationQuery.text = preRegistrationQuery.text.concat(';');

    const deleteCheckoutQuery = squel.delete()
      .from('CHECKOUT_DATA')
      .where('user_id = ?', this.validCheckoutObject().user_id)
      .toParam();
    deleteCheckoutQuery.text = deleteCheckoutQuery.text.concat(';');

    const deleteCheckoutItemQuery = squel.delete()
      .from('CHECKOUT_ITEMS')
      .where('uid = ?', 'test uid')
      .toParam();
    deleteCheckoutItemQuery.text = deleteCheckoutItemQuery.text.concat(';');

    await IntegrationTest.mysqlUow.query(preRegistrationQuery.text, preRegistrationQuery.values);
    await IntegrationTest.mysqlUow.query(extraCreditAssignmentQuery.text, extraCreditAssignmentQuery.values);
    await IntegrationTest.mysqlUow.query(extraCreditClassQuery.text, extraCreditClassQuery.values);
    await IntegrationTest.mysqlUow.query(scanQuery.text, scanQuery.values);
    await IntegrationTest.mysqlUow.query(rfidAssignmentQuery.text, rfidAssignmentQuery.values);
    await IntegrationTest.mysqlUow.query(eventQuery.text, eventQuery.values);
    await IntegrationTest.mysqlUow.query(locationQuery.text, locationQuery.values);
    await IntegrationTest.mysqlUow.query(rsvpQuery.text, rsvpQuery.values);
    await IntegrationTest.mysqlUow.query(registrationQuery.text, registrationQuery.values);
    await IntegrationTest.mysqlUow.query(deleteCheckoutQuery.text, deleteCheckoutQuery.values);
    await IntegrationTest.mysqlUow.query(deleteCheckoutItemQuery.text, deleteCheckoutItemQuery.values);
  }
}
