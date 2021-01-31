import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { FunctionDocumentation } from '../../backk/decorators/service/function/FunctionDocumentation';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import ServiceDocumentation from '../../backk/decorators/service/ServiceDocumentation';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserName from './types/args/UserName';
import User from './types/entities/User';
import UserResponse from './types/responses/UserResponse';
import UsersService from './UsersService';
import _Id from '../../backk/types/id/_Id';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import ChangeUserPasswordArg from './types/args/ChangeUserPasswordArg';
import {
  CANNOT_FOLLOW_SELF,
  INVALID_CURRENT_PASSWORD,
  USER_NAME_CANNOT_BE_CHANGED
} from './errors/usersServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import _IdAndUserId from '../../backk/types/id/_IdAndUserId';
import FollowedUser from './types/entities/FollowedUser';
import { Update } from '../../backk/decorators/service/function/Update';
import FollowingUser from './types/entities/FollowingUser';
import { NoAutoTest } from '../../backk/decorators/service/function/NoAutoTest';
import _IdAndFollowedUserId from './types/args/_IdAndFollowedUserId';

@ServiceDocumentation('Users service doc goes here...')
@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForTests()
  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(User);
  }

  @FunctionDocumentation('createUser function doc goes here...')
  @AllowForEveryUser()
  async createUser(arg: User): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.createEntity(
      { ...arg, commissionDiscountPercentage: 0 },
      User
    );

    return UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  async getUserByUserName({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityWhere('userName', userName, User);
    return UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForServiceInternalUse()
  async getUserById({ _id }: _Id): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityById(_id, User);
    return UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  @Update()
  @Errors([CANNOT_FOLLOW_SELF])
  followUser({ _id, followedUserId }: _IdAndFollowedUserId): Promise<User | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      'followedUsers',
      { _id: followedUserId },
      User,
      FollowedUser,
      () => this.dbManager.addSubEntity(followedUserId, 'followingUsers', { _id }, User, FollowingUser)
    );
  }

  @AllowForSelf()
  @Update()
  @Errors([CANNOT_FOLLOW_SELF])
  unfollowUser({ _id, followedUserId }: _IdAndFollowedUserId): Promise<void | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'followedUsers', followedUserId, User, [
      () => this.dbManager.removeSubEntityById(followedUserId, 'followingUsers', _id, User)
    ]);
  }

  @AllowForSelf()
  updateUser(arg: User): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(arg, User, 'all');
  }

  @AllowForSelf()
  @Errors([USER_NAME_CANNOT_BE_CHANGED, INVALID_CURRENT_PASSWORD])
  changeUserPassword({
    _id,
    currentPassword,
    password,
    userName
  }: ChangeUserPasswordArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      { _id, password },
      User,
      [],
      [
        {
          preHookFunc: ([currentEntity]) => currentEntity.userName === userName,
          errorMessageOnPreHookFuncFailure: USER_NAME_CANNOT_BE_CHANGED
        },
        {
          preHookFunc: async ([{ password: hashedPassword }]) =>
            await argon2.verify(hashedPassword, currentPassword),
          errorMessageOnPreHookFuncFailure: INVALID_CURRENT_PASSWORD
        }
      ]
    );
  }

  @AllowForSelf()
  deleteUserById({ _id }: _Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, User);
  }

  private static getUserResponse(userOrErrorResponse: User | ErrorResponse): UserResponse | ErrorResponse {
    if ('errorMessage' in userOrErrorResponse) {
      return userOrErrorResponse;
    }

    return {
      ...userOrErrorResponse,
      extraInfo: 'Some extra info'
    };
  }
}
