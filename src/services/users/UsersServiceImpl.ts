import { ErrorResponse, Id } from '../../backk/Backk';
import UsersService from './UsersService';
import UserName from './types/args/UserName';
import User from './types/entities/User';
import CreateUserArg from './types/args/CreateUserArg';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { Injectable } from '@nestjs/common';
import UserResponse from './types/responses/UserResponse';

@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(User);
  }

  createUser(arg: CreateUserArg): Promise<Id | ErrorResponse> {
    return this.dbManager.createItem(arg, User, this.Types);
  }

  async getUserByUserName({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const userOrError = await this.dbManager.getItemBy('userName', userName, User, this.Types);

    if ('_id' in userOrError) {
      delete userOrError.password;
      const userResponse = (userOrError as unknown) as UserResponse;
      userResponse.extraInfo = 'Some extra info';
      return userResponse;
    }

    return userOrError;
  }

  updateUser(user: User): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(user, User, this.Types);
  }

  deleteUserById({ _id }: Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, User);
  }
}
