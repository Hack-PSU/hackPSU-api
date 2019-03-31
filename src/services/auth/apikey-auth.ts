import { Inject, Injectable } from 'injection-js';
import moment from 'moment';
import randomNumberCsprng from 'random-number-csprng';
import { default as uuid } from 'uuid/v4';
import { HttpError } from '../../js-common/errors';
import { IFirebaseService } from '../common/firebase/firebase-types/firebase-service';
import { RateLimiter } from '../common/rate-limiter/rate-limiter';
import { RateLimiterService } from '../common/rate-limiter/rate-limiter.service';
import { Apikey, IApikeyAuthService, IApiToken, IPinAuthenticator } from './auth-types';

@Injectable()
export class ApikeyAuthService implements IApikeyAuthService {

  private static validateApiToken(apiToken?: IApiToken): boolean {
    return apiToken!.valid && moment(apiToken!.expiryTime).isAfter(moment());
  }

  private static validatePinAuthenticator(pin: IPinAuthenticator): boolean {
    return pin.valid && moment(pin.expiryTime).isAfter(moment());
  }
  private rateLimiter: RateLimiter;

  private db: FirebaseFirestore.Firestore;
  private readonly APIKEY_COLLECTION = 'apikey';

  private readonly PINS_COLLECTION = 'pins';

  constructor(
    @Inject('FirebaseService') private firebaseService: IFirebaseService,
    @Inject('RateLimiterService') private rateLimiterService: RateLimiterService,
  ) {
    this.db = this.firebaseService.admin.firestore();
    this.rateLimiter = rateLimiterService.instance(200);
  }

  public async checkAuthentication(token?: Apikey, macAddress?: string): Promise<boolean> {
    const doc = await this.db.collection(this.APIKEY_COLLECTION).doc(token).get();
    if (!doc.exists) {
      throw new HttpError('invalid API key', 404);
    }
    const apiToken = doc.data() as IApiToken;
    if (apiToken.macAddress !== macAddress) throw new HttpError('MAC addres did not match', 401);
    if (ApikeyAuthService.validateApiToken(apiToken)) {
      return true;
    }
    throw new HttpError('API key has expired', 401);
  }

  public async generateApiKey(macAddress: string): Promise<IApiToken> {
    const key = uuid();
    const apiToken: IApiToken = {
      key,
      macAddress,
      expiryTime: moment().add(7, 'days').valueOf(),
      mintTime: moment().valueOf(),
      valid: true,
    };
    await this.db.collection(this.APIKEY_COLLECTION).doc(key).set(apiToken);
    return apiToken;
  }

  public async generatePinAuthenticator(): Promise<IPinAuthenticator> {
    const pin: number = await randomNumberCsprng(0, 1000);
    const pinToken: IPinAuthenticator = {
      pin,
      expiryTime: moment().add(5, 'minutes').valueOf(),
      mintTime: moment().valueOf(),
      valid: true,
    };
    await this.db.collection(this.PINS_COLLECTION).doc(pin.toString()).set(pinToken);
    return pinToken;
  }

  public async checkPinAuthentication(pin: number): Promise<boolean> {
    this.rateLimiter.makeRequest();
    const doc = await this.db.collection(this.PINS_COLLECTION).doc(pin.toString()).get();
    if (!doc.exists) {
      return false;
    }
    const apiToken = doc.data() as IPinAuthenticator;
    const result = ApikeyAuthService.validatePinAuthenticator(apiToken);
    await this.db.collection(this.PINS_COLLECTION).doc(pin.toString()).delete();
    return result;
  }
}
