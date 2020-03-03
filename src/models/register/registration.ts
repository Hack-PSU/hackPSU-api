import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const registeredUserSchema = jsonAssetLoader('registeredUserSchema');

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NONBINARY = 'non-binary',
  NODISCLOSE = 'no-disclose',
}

export enum ShirtSize {
  XSMALL = 'XS',
  SMALL = 'S',
  MEDIUM = 'M',
  LARGE = 'L',
  XLARGE = 'XL',
  XXLARGE = 'XXL',
}

export enum AcademicYear {
  FRESHMAN = 'freshman',
  SOPHOMORE = 'sophomore',
  JUNIOR = 'junior',
  SENIOR = 'senior',
  GRADUATE = 'graduate',
  OTHER = 'other',
}

export enum CodingExperience {
  NONE = 'none',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  GOD = 'god',
}

export enum VeteranOptions {
  YES = 'true',
  NO = 'false',
  NODISCLOSE = 'no-disclose',
}

export interface IRegistrationApiModel {
  time: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  shirtSize: ShirtSize;
  dietaryRestriction: string | null;
  allergies: string | null;
  travelReimbursement: boolean;
  firstHackathon: boolean;
  university: string;
  email: string;
  academicYear: AcademicYear;
  major: string;
  phone: string;
  ethnicity: string | null;
  resume: string | null;
  codingExperience: CodingExperience | null;
  uid?: UidType;
  eighteenBeforeEvent: boolean;
  mlhcoc: boolean;
  mlhdcp: boolean;
  referral: string | null;
  projectDesc: string | null;
  expectations: string | null;
  veteran: VeteranOptions;
  submitted: boolean;
  interests: string | null;
}

export class Registration extends BaseObject {

  public get schema() {
    return registeredUserSchema;
  }

  public firstname: string;
  public lastname: string;
  public gender: string;
  public shirt_size: string;
  public dietary_restriction: string | null;
  public allergies: string | null;
  public travel_reimbursement: boolean;
  public first_hackathon: boolean;
  public university: string;
  public email: string;
  public academic_year: string;
  public major: string;
  public phone: string;
  public race: string | null;
  public resume: string | null;
  public coding_experience: string | null;
  public uid?: string;
  public eighteenBeforeEvent: boolean;
  public mlh_coc: boolean;
  public mlh_dcp: boolean;
  public referral: string | null;
  public project: string | null;
  public expectations: string | null;
  public veteran: string;
  public time: number;
  public hackathon: string;
  public submitted: boolean;
  public pin: number;
  public interests: string | null;

  constructor(data: IRegistrationApiModel) {
    super();
    this.firstname = data.firstName;
    this.lastname = data.lastName;
    this.gender = data.gender;
    this.shirt_size = data.shirtSize;
    this.dietary_restriction = data.dietaryRestriction || null;
    this.allergies = data.allergies || null;
    this.travel_reimbursement = data.travelReimbursement;
    this.first_hackathon = data.firstHackathon;
    this.university = data.university;
    this.email = data.email;
    this.academic_year = data.academicYear;
    this.major = data.major;
    this.phone = data.phone;
    this.race = data.ethnicity;
    this.resume = data.resume;
    this.coding_experience = data.codingExperience;
    this.uid = data.uid;
    this.eighteenBeforeEvent = data.eighteenBeforeEvent;
    this.mlh_coc = data.mlhcoc;
    this.mlh_dcp = data.mlhdcp;
    this.referral = data.referral;
    this.project = data.projectDesc;
    this.expectations = data.expectations;
    this.veteran = data.veteran;
    this.time = data.time;
    this.submitted = data.submitted;
    this.interests = data.interests || null;
    // this.hackathon = data.hackathon;
  }

  public get id() {
    return this.uid;
  }
}

export interface IRegistrationStats {
  academic_year: AcademicYear;
  coding_experience: CodingExperience;
  dietary_restriction: string | null;
  travel_reimbursement: boolean;
  race: string | null;
  shirt_size: ShirtSize;
  gender: Gender;
  first_hackathon: boolean;
  veteran: VeteranOptions;
}
