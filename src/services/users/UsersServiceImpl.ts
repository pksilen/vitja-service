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
    const userOrError = await this.abstractDbManager.getItemBy<User>(
      'userName',
      userNameWrapper.userName,
      User,
      this.Types
    );


    if ('_id' in userOrError) {
      delete userOrError.password;
      const userResponse = userOrError as unknown as UserResponse;
      userResponse.extraInfo = 'Some extra info';
      return userResponse;
    }

    return userOrError;
  }

  async updateUser(user: User): Promise<void | ErrorResponse> {
    await this.abstractDbManager.updateItem(user, User, this.Types);
  }

  async deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await this.abstractDbManager.deleteItemById(idWrapper._id, User);
  }
}
