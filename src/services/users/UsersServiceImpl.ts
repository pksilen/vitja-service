import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { FunctionDocumentation } from '../../backk/decorators/service/function/FunctionDocumentation';
import { Private } from '../../backk/decorators/service/function/Private';
import ServiceDocumentation from '../../backk/decorators/service/ServiceDocumentation';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import CreateUserArg from './types/args/CreateUserArg';
import UpdateUserArg from './types/args/UpdateUserArg';
import UserName from './types/args/UserName';
import User from './types/entities/User';
import UserResponse from './types/responses/UserResponse';
import UsersService from './UsersService';
import _Id from '../../backk/types/_Id';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import ChangeUserPasswordArg from './types/args/ChangeUserPasswordArg';

@ServiceDocumentation('Users service doc goes here...')
@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(User);
  }

  @FunctionDocumentation('createUser function doc goes here...')
  @AllowForEveryUser()
  async createUser(arg: CreateUserArg): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.createItem(arg, User, this.Types);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  async getUserByUserName({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getItemBy('userName', userName, User, this.Types);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @Private()
  async getUserById({ _id }: _Id): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getItemById(_id, User, this.Types);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  updateUser(arg: UpdateUserArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(arg, User, this.Types);
  }

  @AllowForSelf()
  changeUserPassword(arg: ChangeUserPasswordArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem({ _id: arg._id, password: arg.password }, User, this.Types, [
      {
        jsonPath: 'userName',
        hookFunc: (userName) => userName === arg.userName,
        errorMessage: 'User name cannot be changed'
      },
      {
        jsonPath: 'password',
        hookFunc: async (hashedPassword) => await argon2.verify(hashedPassword, arg.currentPassword),
        errorMessage: 'Invalid current password'
      }
    ]);
  }

  @AllowForSelf()
  deleteUserById({ _id }: _Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, User);
  }

  private static getUserResponse(user: User): UserResponse {
    return {
      ...user,
      extraInfo: 'Some extra info'
    };
  }
}
