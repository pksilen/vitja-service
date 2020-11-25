import { Service } from './Service';
import AbstractDbManager from '../dbmanager/AbstractDbManager';

export default class BaseService implements Service {
  readonly Types: object;
  readonly PublicTypes: object;

  constructor(protected readonly dbManager: AbstractDbManager) {
    this.Types = {};
    this.PublicTypes = {};
    if (dbManager) {
      dbManager.addService(this);
    }
  }

  getDbManager(): AbstractDbManager {
    return this.dbManager;
  }

  isUsersService(): boolean {
    return false;
  }
}
