import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/annotations/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/annotations/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/annotations/service/function/AllowForSelf';
import { FunctionDocumentation } from '../../backk/annotations/service/function/FunctionDocumentation';
import { Private } from '../../backk/annotations/service/function/Private';
import ServiceDocumentation from '../../backk/annotations/service/ServiceDocumentation';
import { ErrorResponse, Id } from '../../backk/Backk';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import CreateUserArg from './types/args/CreateUserArg';
import UpdateUserArg from './types/args/UpdateUserArg';
import UserName from './types/args/UserName';
import User from './types/entities/User';
import UserResponse from './types/responses/UserResponse';
import UsersService from './UsersService';

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
    return '_id' in userOrErrorResponse
      ? UsersServiceImpl.getUserResponse(userOrErrorResponse)
      : userOrErrorResponse;
  }

  @AllowForSelf()
  async getUserByUserName({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getItemBy('userName', userName, User, this.Types);
    return '_id' in userOrErrorResponse
      ? UsersServiceImpl.getUserResponse(userOrErrorResponse)
      : userOrErrorResponse;
  }

  @Private()
  async getUserById({ _id }: Id): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getItemById(_id, User, this.Types);
    return '_id' in userOrErrorResponse
      ? UsersServiceImpl.getUserResponse(userOrErrorResponse)
      : userOrErrorResponse;
  }

  @AllowForSelf()
  updateUser(arg: UpdateUserArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(arg, User, this.Types);
  }

  @AllowForSelf()
  deleteUserById({ _id }: Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, User);
  }

  private static getUserResponse(userOrErrorResponse: User) {
    delete userOrErrorResponse.password;
    const userResponse = (userOrErrorResponse as unknown) as UserResponse;
    userResponse.extraInfo = 'Some extra info';
    return userResponse;
  }
}
