/* eslint-disable no-underscore-dangle,no-param-reassign,class-methods-use-this */
import ajv from 'ajv';

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
    return Object.entries(this)
      .filter(kv => !this.disallowedPropertiesInternal.has(kv[0]))
      .filter(kv => kv[1] !== undefined || kv[1] !== null)
      .reduce((accumulator, currentValue) => {
        accumulator[currentValue[0]] = currentValue[1];
        return accumulator;
      },      {});
  }

  /**
   * This function strips the object of any internal properties
   * Specifically, it removes the disallowedProperties Set, but in case there
   * are any other fields in subclasses that should not be present in an instance
   * of the object sent for APIs, override this method and delete those there
   */
  public get cleanRepresentation() {
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
  public abstract get id();

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

  // /**
  //  * Returns all or certain number of objects as a stream
  //  * @param uow Unit of work object to make query on
  //  * @param tableName Table name for the provided object (SQL ONLY)
  //  * @param opts {{}} opts.fields: fields to include :: opts.startAt: object number to start at ::
  //  * opts.count: how many objects to return
  //  * @return {Promise<Stream>}
  //  */
  // public static getAll(uow: IUow, tableName: string, opts?: IUowOpts) {
  //   const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
  //     .from(tableName)
  //     .fields((opts && opts.fields) || null)
  //     .offset((opts && opts.startAt) || null)
  //     .limit((opts && opts.count) || null)
  //     .toString()
  //     .concat(';');
  //   const params = [];
  //   return uow.query(query, params, { stream: true, cache: true });
  // }

  // /**
  //  * Returns the number of objects of the type.
  //  * @param uow
  //  * @param tableName
  //  * @param columnName
  //  * @returns {Promise<Stream>}
  //  */
  // public static getCount(uow, tableName, columnName?) {
  //   const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
  //     .from(tableName)
  //     .field(`COUNT(${columnName || 'uid'})`, 'count')
  //     .toString()
  //     .concat(';');
  //   const params = [];
  //   return uow.query(query, params, { stream: true, cache: true });
  // }

  /*********** PROPERTIES *************/
    // protected uow: IUow;
    // In a sub-class, make sure this array also includes all super properties
  protected readonly disallowedPropertiesInternal: Set<string>;

  protected constructor() {
    this.disallowedPropertiesInternal = new Set();
    this.disallowedProperties = ['disallowedPropertiesInternal'];
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

  // /**
  //  * Returns one object as noted by parameter uid
  //  * If opts.query is set, it will not generate a new query but make the database call directly
  //  * @param opts {{}} opts.fields: fields to include
  //  * @return {Promise<BaseObject>}
  //  */
  // public get(opts?: IUowOpts) {
  //   if (opts && opts.query) {
  //     return this.uow.query(opts.query.text, opts.query.values, { stream: false, cache: true });
  //   }
  //   const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
  //     .from(this.tableName)
  //     .fields((opts && opts.fields) || null)
  //     .where(`${this.columnName}= ?`, this.id)
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return this.uow.query(query.text, query.values, { stream: false, cache: true });
  // }

  // /**
  //  * Adds a new object to the appropriate table
  //  * @return {Promise<any>}
  //  */
  // public add(opts?: IUowOpts) {
  //   if (opts && opts.query) {
  //     return this.uow.query(opts.query.text, opts.query.values, { stream: false, cache: false });
  //   }
  //   const validation = this.validate();
  //   if (!validation.result) {
  //     logger.warn('Validation failed while adding object.');
  //     logger.warn(this.dbRepresentation);
  //     return Promise.reject(new HttpError(validation.error, 400));
  //   }
  //   const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
  //     .into(this.tableName)
  //     .setFieldsRows([this.dbRepresentation])
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return this.uow.query(query.text, query.values, { stream: false, cache: false });
  // }

  // /**
  //  * Updates the object in the database
  //  * @return {Promise<any>}
  //  */
  // public update(opts?: IUowOpts) {
  //   if (opts && opts.query) {
  //     return this.uow.query(opts.query.text, opts.query.values, { stream: false, cache: false });
  //   }
  //   const validation = this.validate();
  //   if (!validation.result) {
  //     return new Promise(((resolve, reject) => reject(new HttpError(validation.error, 400))));
  //   }
  //   const query = squel.update({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
  //     .table(this.tableName)
  //     .setFields(this.dbRepresentation)
  //     .where(`${this.columnName} = ?`, this.id)
  //     .toParam();
  //   query.text = query.text.concat(';');
  //   return this.uow.query(query.text, query.values, { stream: false, cache: false });
  // }

  // /**
  //  * Deletes the object from the database
  //  * @return {Promise<any>}
  //  */
  // public delete(opts?: IUowOpts) {
  //   if (opts && opts.query) {
  //     return this.uow.query(opts.query.text, opts.query.values, { stream: false, cache: false });
  //   }
  //
  //   const query = squel.delete({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
  //     .from(this.tableName)
  //     .where(`${this.columnName} = ?`, this.id)
  //     .toParam();
  //   query.text = query.text.concat(';');
  //
  //   return this.uow.query(query.text, query.values, { stream: false, cache: false });
  // }
}
