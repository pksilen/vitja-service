import BaseService from "./BaseService";

export default class UsersBaseService extends BaseService {
  isUsersService(): boolean {
    return true;
  }
}
