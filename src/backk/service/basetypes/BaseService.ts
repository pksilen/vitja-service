import { Service } from './Service';
import AbstractDbManager from '../../dbmanager/AbstractDbManager';

export default class BaseService implements Service {
  constructor(protected readonly dbManager: AbstractDbManager, Types: object) {
    if (dbManager) {
      dbManager.addTypes(Types);
    }
  }

  getDbManager(): AbstractDbManager {
    return this.dbManager;
  }

  isUsersService(): boolean {
    return false;
  }
}
