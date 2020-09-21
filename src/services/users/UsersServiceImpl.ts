import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UsersService from './UsersService';
import UserNameWrapper from './types/UserNameWrapper';
import User from './types/User';
import UserCreateDto from './types/UserCreateDto';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { Injectable } from '@nestjs/common';
import UserResponse from './types/UserResponse';

@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(User);
  }

  createUser(userCreateDto: UserCreateDto): Promise<IdWrapper | ErrorResponse> {
    return this.dbManager.createItem(userCreateDto, User, this.Types);
  }

  async getUserByUserName({ userName }: UserNameWrapper): Promise<UserResponse | ErrorResponse> {
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

  deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(idWrapper._id, User);
  }
}
