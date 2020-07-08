import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UsersService from './UsersService';
import UserNameWrapper from './types/UserNameWrapper';
import User from './types/User';
import UserWithoutId from './types/UserWithoutId';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { Injectable } from '@nestjs/common';
import UserResponse from './types/UserResponse';

@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(private readonly abstractDbManager: AbstractDbManager) {
    super();
  }

  async deleteAllUsers(): Promise<void | ErrorResponse> {
    return await this.abstractDbManager.deleteAllItems(User);
  }

  async createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await this.abstractDbManager.createItem(userWithoutId, User, this.Types);
  }

  async getUserByUserName(userNameWrapper: UserNameWrapper): Promise<UserResponse | ErrorResponse> {
    const user = await this.abstractDbManager.getItemBy(
      'userName',
      userNameWrapper.userName,
      User,
      this.Types
    ) as UserResponse;

    delete user.password;
    user.extraInfo = 'Some extra info';
    return user;
  }

  async updateUser(user: User): Promise<void | ErrorResponse> {
    await this.abstractDbManager.updateItem(user, User, this.Types);
  }

  async deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await this.abstractDbManager.deleteItemById(idWrapper._id, User);
  }
}
