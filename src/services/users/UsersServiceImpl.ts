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

  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.abstractDbManager.deleteAllItems(User);
  }

  createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse> {
    return this.abstractDbManager.createItem(userWithoutId, User, this.Types);
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

  updateUser(user: User): Promise<void | ErrorResponse> {
    return this.abstractDbManager.updateItem(user, User, this.Types);
  }

  deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    return this.abstractDbManager.deleteItemById(idWrapper._id, User);
  }
}
