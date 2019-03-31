export type EpochNumber = number;
export type UidType = string;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface ICompoundUidType {
  uid: UidType;
}

export interface ICompoundHackathonUidType extends ICompoundUidType {
  hackathon: UidType;
}
