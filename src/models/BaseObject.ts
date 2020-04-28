/* eslint-disable no-underscore-dangle,no-param-reassign,class-methods-use-this */
import ajv from 'ajv';
import { default as _ } from 'lodash';
import { IApiModel } from '../services/database';

const ajvValidator = new ajv();
/**
 * @class BaseObject
 * The base object definition for any table in the database
 */
export default abstract class BaseObject {

  /**
   * Returns a representation of the object that can be added directly to the database
   * For any subclass that contains properties that do not get added to the db,
   * ensure that this method is overridden and calls super.dbRepresentation()
   * @return {Object}
   * @private
   */
  public get dbRepresentation() {
    return _(this)
      .omit(Array.from(this.disallowedPropertiesInternal.values()))
      .omitBy(_.isNil)
      .value();
  }

  /**
   * This function strips the object of any internal properties
   * Specifically, it removes the disallowedProperties Set, but in case there
   * are any other fields in subclasses that should not be present in an instance
   * of the object sent for APIs, override this method and delete those there
   */
  public get cleanRepresentation(): IApiModel<this> {
    const clone = { ...this };
    // @ts-ignore
    delete clone.disallowedPropertiesInternal;
    return clone;
  }

  /**
   * Returns the current disallowed properties for the object
   * @returns {string[]}
   */
  protected get disallowedProperties(): string[] {
    return Array.from(this.disallowedPropertiesInternal);
  }

  /**
   * Set any properties that should not be included in the database representation
   * @param {string[]} arr
   */
  protected set disallowedProperties(arr: string[]) {
    arr.forEach(val => this.disallowedPropertiesInternal.add(val));
  }

  /**
   *
   * @returns {*} The primary key value for this object type
   * @abstract
   */
  public abstract uid;

  /**
   * Merge two instances for update
   * @param {this} oldObject Old object that passes validation
   * @param {this} newObject New instance with updated fields
   */
  // public abstract merge(oldObject: this, newObject: this): this;

  /**
   * @returns {any} The AJV validation schema
   * @abstract
   */
  protected abstract get schema(): any;

  public static fromDb(this: new () => BaseObject, dbObject: any) {
    const obj = new this();
    return _.merge(obj, dbObject);
  }

  /*********** PROPERTIES *************/
  // In a sub-class, make sure this array also includes all super properties
  protected readonly disallowedPropertiesInternal: Set<string>;

  protected constructor() {
    this.disallowedPropertiesInternal = new Set();
    this.disallowedProperties = ['disallowedPropertiesInternal'];
  }

  public merge(newObject: this, oldObject: this): this {
    return _.merge(Object.create(this), oldObject, newObject);
  }

  /**
   * Validates that the object matches some ajv schema
   * @return {result: boolean, error: string}
   */
  public validate(): { result: boolean, error?: string } {
    if (this.schema) {
      const validate = ajvValidator.compile(this.schema);
      const result = validate(this) as boolean;
      return {
        error: result ?
          undefined :
          ajvValidator.errorsText(validate.errors as unknown as ajv.ErrorObject[] | undefined),
        result,
      };
    }
    return { result: true, error: undefined };
  }
}
