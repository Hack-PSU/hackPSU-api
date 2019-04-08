import { AdminDataMapperImpl } from '../../../models/admin';
import { AdminStatisticsDataMapperImpl } from '../../../models/admin/statistics/admin-statistics-data-mapper-impl';
import { AttendanceDataMapperImpl } from '../../../models/attendance/attendance-data-mapper-impl';
import { CheckoutItemsDataMapperImpl } from '../../../models/checkout-items/checkout-items-data-mapper-impl';
import { CheckoutObjectDataMapperImpl } from '../../../models/checkout-object/checkout-object-data-mapper-impl';
import { EventDataMapperImpl } from '../../../models/event/event-data-mapper-impl';
import { ExtraCreditDataMapperImpl } from '../../../models/extra-credit/extra-credit-data-mapper-impl';
import { HackathonDataMapperImpl } from '../../../models/hackathon';
import { ActiveHackathonDataMapperImpl } from '../../../models/hackathon/active-hackathon';
import { LocationDataMapperImpl } from '../../../models/location/location-data-mapper-impl';
import { PreRegisterDataMapperImpl } from '../../../models/register/pre-register-data-mapper-impl';
import { RegisterDataMapperImpl } from '../../../models/register/register-data-mapper-impl';
import { RsvpDataMapperImpl } from '../../../models/RSVP/RSVP-data-mapper-impl';
import { ScannerDataMapperImpl } from '../../../models/scanner/scanner-data-mapper-impl';
import { UpdateDataMapperImpl } from '../../../models/update/update-data-mapper-impl';
import { AdminProcessor } from '../../../processors/admin-processor';
import { IndexProcessor } from '../../../processors/index-processor';
import { PreRegistrationProcessor } from '../../../processors/pre-registration-processor';
import { RegistrationProcessor } from '../../../processors/registration-processor';
import { ScannerProcessor } from '../../../processors/scanner-processor';
import { UpdateProcessor } from '../../../processors/update-processor';
import { IndexController } from '../../../router/routes';
import {
  AdminHackathonController,
  AdminLocationController,
  AdminRegisterController,
  AdminStatisticsController,
} from '../../../router/routes/admin';
import { AdminController } from '../../../router/routes/admin/';
import { AdminCheckoutController } from '../../../router/routes/admin/admin-checkout';
import { InternalController } from '../../../router/routes/internal';
import { EventsController } from '../../../router/routes/live/events';
import { LiveController } from '../../../router/routes/live/live';
import { UpdatesController } from '../../../router/routes/live/updates';
import { ScannerController } from '../../../router/routes/scanner/scanner';
import { UsersController } from '../../../router/routes/users';
import { FirebaseAuthService } from '../../auth';
import { ApikeyAuthService } from '../../auth/apikey-auth';
import { RBAC } from '../../auth/RBAC/rbac';
import { SendgridService } from '../../communication/email/sendgrid.service';
import { OnesignalService } from '../../communication/push-notification/onesignal.service';
import { MemCacheServiceImpl } from '../../database/cache/memcache-impl.service';
import { RtdbConnectionFactory } from '../../database/connection/rtdb-connection-factory';
import { SqlConnectionFactory } from '../../database/connection/sql-connection-factory';
import { MysqlUow } from '../../database/svc/mysql-uow.service';
import { RtdbUow } from '../../database/svc/rtdb-uow.service';
import { Logger } from '../../logging/logging';
import { GoogleStorageService } from '../../storage/svc/google-storage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { RootInjector } from './root-injector';

export class ExpressProvider {
  public static config() {
    RootInjector.registerProvider(
      [
        // Controllers
        { provide: 'IndexController', useClass: IndexController },
        { provide: 'LiveController', useClass: LiveController },
        { provide: 'UpdatesController', useClass: UpdatesController },
        { provide: 'EventsController', useClass: EventsController },
        { provide: 'InternalController', useClass: InternalController },
        { provide: 'UsersController', useClass: UsersController },
        { provide: 'AdminController', useClass: AdminController },
        { provide: 'ScannerController', useClass: ScannerController },
        { provide: 'AdminRegisterController', useClass: AdminRegisterController },
        { provide: 'AdminStatisticsController', useClass: AdminStatisticsController },
        { provide: 'AdminHackathonController', useClass: AdminHackathonController },
        { provide: 'AdminLocationController', useClass: AdminLocationController },
        { provide: 'AdminCheckoutController', useClass: AdminCheckoutController },

          // Processors
          { provide: 'IIndexProcessor', useClass: IndexProcessor },
          { provide: 'IRegistrationProcessor', useClass: RegistrationProcessor },
          { provide: 'IPreregistrationProcessor', useClass: PreRegistrationProcessor },
        { provide: 'IAdminProcessor', useClass: AdminProcessor },
        { provide: 'IAdminScannerProcessor', useClass: ScannerProcessor },
        { provide: 'IScannerProcessor', useClass: ScannerProcessor },
        { provide: 'IUpdateProcessor', useClass: UpdateProcessor },

        // Data Mappers
          { provide: 'IUpdateDataMapper', useClass: UpdateDataMapperImpl },
          { provide: 'IEventDataMapper', useClass: EventDataMapperImpl },
          { provide: 'ILocationDataMapper', useClass: LocationDataMapperImpl },
          { provide: 'IAttendanceDataMapper', useClass: AttendanceDataMapperImpl },
          { provide: 'IExtraCreditDataMapper', useClass: ExtraCreditDataMapperImpl },
          { provide: 'IRegisterDataMapper', useClass: RegisterDataMapperImpl },
          { provide: 'IPreRegisterDataMapper', useClass: PreRegisterDataMapperImpl },
          { provide: 'IRsvpDataMapper', useClass: RsvpDataMapperImpl },
          { provide: 'IActiveHackathonDataMapper', useClass: ActiveHackathonDataMapperImpl },
          { provide: 'IHackathonDataMapper', useClass: HackathonDataMapperImpl },
          { provide: 'IAdminDataMapper', useClass: AdminDataMapperImpl },
          { provide: 'IAdminStatisticsDataMapper', useClass: AdminStatisticsDataMapperImpl },
          { provide: 'IScannerDataMapper', useClass: ScannerDataMapperImpl },
          { provide: 'ICheckoutObjectDataMapper', useClass: CheckoutObjectDataMapperImpl },
          { provide: 'ICheckoutItemsDataMapper', useClass: CheckoutItemsDataMapperImpl },

        // Interfaces
        { provide: 'IAcl', useClass: RBAC },
        { provide: 'IAuthService', useClass: FirebaseAuthService },
        { provide: 'IScannerAuthService', useClass: ApikeyAuthService },
        { provide: 'IConnectionFactory', useClass: SqlConnectionFactory },
        { provide: 'IRtdbFactory', useClass: RtdbConnectionFactory },
        { provide: 'IPushNotifService', useClass: OnesignalService },
        { provide: 'ICacheService', useClass: MemCacheServiceImpl },
        { provide: 'IEmailService', useClass: SendgridService },
        { provide: 'IStorageService', useClass: GoogleStorageService },

        // Classes
        { provide: 'FirebaseService', useValue: FirebaseService.instance },
        { provide: 'RateLimiterService', useClass: RateLimiterService },
        { provide: 'MysqlUow', useClass: MysqlUow },
        { provide: 'RtdbUow', useClass: RtdbUow },
        { provide: 'BunyanLogger', useClass: Logger },
      ],
    );
  }
}
