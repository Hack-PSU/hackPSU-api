import * as squel from 'squel';

interface IReadLockMixin {
  forUpdate(): this;

  forReadLock(): this;
}

// @ts-ignore
class SelectWithLockQuery extends squel.cls.Select implements IReadLockMixin {
  private updateLock: boolean;
  private readLock: boolean;

  constructor(options) {
    super(options, [...(new squel.cls.Select().blocks)]);
  }

  public forUpdate() {
    this.updateLock = true;
    if (this.readLock) {
      this.readLock = false;
    }
    return this;
  }

  public forReadLock() {
    this.readLock = true;
    if (this.updateLock) {
      this.updateLock = false;
    }
    return this;
  }

  public _toParamString(options?: squel.ToParamOptions): squel.ParamString {
    const paramString = super._toParamString();
    paramString.text = paramString.text.concat(this.readLock ?
      ' LOCK IN SHARED MODE' :
      this.updateLock ? ' FOR UPDATE' : '');
    return paramString;
  }
}

export const selectLock = options => new SelectWithLockQuery(options);
