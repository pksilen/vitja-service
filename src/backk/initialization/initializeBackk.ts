import * as fs from 'fs';
import defaultSystemAndNodeJsMetrics from '../observability/metrics/defaultSystemAndNodeJsMetrics';
import initializeDatabase from '../dbmanager/sql/operations/ddl/initializeDatabase';
import log, { Severity } from '../observability/logging/log';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import logEnvironment from '../observability/logging/logEnvironment';

export default async function initializeBackk(app: any, dbManager: AbstractDbManager) {
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  if (fs.existsSync('/etc/config/logging/LOG_LEVEL')) {
    fs.watchFile('/etc/config/logging/LOG_LEVEL', () => {
      try {
        const newLogLevel = fs.readFileSync('/etc/config/logging/LOG_LEVEL', { encoding: 'UTF-8' });
        process.env.LOG_LEVEL = newLogLevel.trim();
      } catch (error) {
        // NOOP
      }
    });
  }
  await app.listen(3000);
  log(Severity.INFO, 'Service started', '');
}
