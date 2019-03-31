import * as firebase from 'firebase-admin';
import { Constants } from '../../../assets/constants/constants';
// tslint:disable:import-name
// @ts-ignore: module name error
import configJson from '../../../firebase_config.json';
import { Environment, Util } from '../../../js-common/util';
import { IFirebaseService } from './firebase-types/firebase-service';

/**
 * Singleton class
 */
export class FirebaseService implements IFirebaseService {

  public static get instance() {
    if (!this._instance) {
      this._instance = new FirebaseService();
    }
    return this._instance;
  }

  public get admin() {
    return this._admin;
  }
  private static _instance: FirebaseService;
  private readonly _admin: firebase.app.App;

  private constructor() {
    let databaseURL;
    switch (Util.getCurrentEnv()) {
      case Environment.PRODUCTION:
        databaseURL = Constants.firebaseDB.prod;
        break;
      case Environment.TEST:
        databaseURL = Constants.firebaseDB.test;
        break;
      case Environment.STAGING:
        databaseURL = Constants.firebaseDB.debug;
        break;
      case Environment.DEBUG:
        databaseURL = Constants.firebaseDB.debug;
        break;
      default:
        throw new Error('Illegal environment type. Could not instantiate Firebase database');
    }
    this._admin = firebase.initializeApp({
      credential: firebase.credential.cert({
        clientEmail: configJson.client_email,
        privateKey: configJson.private_key,
        projectId: configJson.project_id,
      }),
      databaseURL,
    });
  }
}
