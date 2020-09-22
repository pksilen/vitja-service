import { Service } from './Service';
import AbstractDbManager from './dbmanager/AbstractDbManager';

export default class BaseService implements Service {
  constructor(protected readonly dbManager: AbstractDbManager) {}

  getDbManager(): AbstractDbManager {
    return this.dbManager;
  }
}
