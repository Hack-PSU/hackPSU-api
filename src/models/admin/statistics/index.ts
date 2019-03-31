import { EpochNumber, UidType } from '../../../js-common/common-types';
import { IDbResult } from '../../../services/database';
import { IUowOpts } from '../../../services/database/svc/uow.service';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  ShirtSize,
  VeteranOptions,
} from '../../register/registration';

export interface IUserCount {
  pre_count: number;
  reg_count: number;
  rsvp_count: number;
  checkin_count: number;
}

export interface IUserStatistics {
  // Pre-Registration data
  pre_uid: UidType;
  pin: number;
  // Registration data
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
  veteran: VeteranOptions | null;
  // Hackathon data
  name: string;
  start_time: EpochNumber;
  end_time: EpochNumber;
  base_pin: number;
  active: boolean;
  // rsvp data
  user_id: UidType;
  rsvp_time: EpochNumber;
  rsvp_status: boolean;
  // Wristband  data
  user_uid: UidType;
}

export interface IAdminStatisticsDataMapper {
  getUserCountByCategory(uowOpts?: IUowOpts): Promise<IDbResult<IUserCount[]>>;

  getAllUserData(opts?: IUowOpts): Promise<IDbResult<IUserStatistics[]>>;
}
