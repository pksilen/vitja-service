import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UsersService from './UsersService';
import UserNameWrapper from './types/UserNameWrapper';
import User from './types/User';
import UserWithoutId from './types/UserWithoutId';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { Injectable } from "@nestjs/common";

@Injectable()
export default class MongoDbUsersServiceImpl extends UsersService {
  constructor(private readonly abstractDbManager: AbstractDbManager) {
    super();
  }

  async deleteAllUsers(): Promise<void | ErrorResponse> {
    return await this.abstractDbManager.deleteAllItems(User);
  }

  async createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await this.abstractDbManager.createItem(userWithoutId, User);
  }

  async getUserByUserName(userNameWrapper: UserNameWrapper): Promise<User | ErrorResponse> {
    return await this.abstractDbManager.getItemBy('userName', userNameWrapper.userName, User);
  }

  async updateUser(user: User): Promise<void | ErrorResponse> {
    await this.abstractDbManager.updateItem(user, User);
  }

  async deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await this.abstractDbManager.deleteItemById(idWrapper._id, User);
  }
}
