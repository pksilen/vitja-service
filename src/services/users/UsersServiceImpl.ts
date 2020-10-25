import { Injectable } from '@nestjs/common';
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
  deleteUserById({ _id }: _Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, User);
  }

  private static getUserResponse(userOrErrorResponse: User) {
    delete userOrErrorResponse.password;
    const userResponse = (userOrErrorResponse as unknown) as UserResponse;
    userResponse.extraInfo = 'Some extra info';
    return userResponse;
  }
}
