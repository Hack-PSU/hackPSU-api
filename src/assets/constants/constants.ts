import * as fs from 'fs';
import * as path from 'path';
import { Util } from '../../js-common/util';

export class Constants {
  // Connection configuration for SQL db
  public static readonly sqlConnection = {
    acquireTimeout: 10 * 1000,
    connectTimeout: 10 * 1000,
    connectionLimit: 56,
    database: Util.readEnv('SQL_DATABASE', 'my_db'),
    host: Util.readEnv('SQL_HOSTNAME', 'localhost'),
    multipleStatements: true,
    password: Util.readEnv('SQL_PASSWORD', '') || Util.readEnv('RDS_PASSWORD', ''),
    port: parseInt(Util.readEnv('SQL_PORT', '3306'), 10),
    socketPath: `/cloudsql/${Util.readEnv('INSTANCE_CONNECTION_NAME', '')}`,
    timeout: 60 * 60 * 1000,
    typeCast: function castField(field, useDefaultTypeCasting) {
      // We only want to cast bit fields that have a single-bit in them. If the field
      // has more than one bit, then we cannot assume it is supposed to be a Boolean.
      if ((field.type === 'BIT') && (field.length === 1)) {
        const bytes = field.buffer();

        // A Buffer in Node represents a collection of 8-bit unsigned integers.
        // Therefore, our single "bit field" comes back as the bits '0000 0001',
        // which is equivalent to the number 1.
        return (bytes[0] === 1);
      }
      if (field.type === 'TINY') {
        // For TINYINT, which is used as a boolean in the database
        // Convert it to boolean value
        return field.string() === '1';
      }
      return (useDefaultTypeCasting());
    },
    user: Util.readEnv('SQL_USER', 'user'),
  };

  public static readonly firebaseDB = {
    debug: '*fill-url-here*',
    prod: '*fill-url-here*',
    staging: '*fill-url-here*',
    test: '*fill-url-here*',
  };

  public static readonly pushNotifKey = {
    app_id: Util.readEnv('ONESIGNAL_APP_ID', ''),
    key: Util.readEnv('ONESIGNAL_API_KEY', ''),
  };

  public static readonly RSVPEmailHtml = {
    fromEmail: '*fill-email-here*',
    subject: 'rsvp confirmation',
    text: fs.readFileSync(path.join(__dirname, '*fill-path-here*'), 'utf-8'),
  };

  public static readonly GCS = {
    resumeBucket: Util.readEnv('RESUME_BUCKET', 'resumes'),
    travelReimbursementBucket: Util.readEnv('TRAVEL_REIMBURSEMENT_BUCKET', 'travel-reimbursement-receipts'),
    projectId: Util.readEnv('GOOGLE_CLOUD_PROJECT', ''),
    keyFile: 'gcs_config.json',
  };
  public static readonly SendGridApiKey = Util.readEnv('SENDGRID_ACCESS_KEY', '');
  public static readonly MailchimpApiKey = Util.readEnv('MAILCHIMP_API_KEY', '');
}
