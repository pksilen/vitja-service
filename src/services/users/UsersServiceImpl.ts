import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import { FunctionDocumentation } from "../../backk/decorators/service/function/FunctionDocumentation";
import { AllowForServiceInternalUseOnly } from "../../backk/decorators/service/function/AllowForServiceInternalUseOnly";
import ServiceDocumentation from "../../backk/decorators/service/ServiceDocumentation";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserName from "./types/args/UserName";
import User from "./types/entities/User";
import UserResponse from "./types/responses/UserResponse";
import UsersService from "./UsersService";
import _Id from "../../backk/types/id/_Id";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import { INVALID_CURRENT_PASSWORD, USER_NAME_CANNOT_BE_CHANGED } from "./errors/usersServiceErrors";
import { Errors } from "../../backk/decorators/service/function/Errors";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";

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
    const userOrErrorResponse = await this.dbManager.createEntity(arg, User);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  async getUserByUserName({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityWhere('userName', userName, User);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForServiceInternalUseOnly()
  async getUserById({ _id }: _Id): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityById(_id, User);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
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
    newPassword,
    userName
  }: ChangeUserPasswordArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      { _id, password: newPassword },
      User,
      [],
      [
        {
          hookFunc: ([{ userName: currentUserName }]) => currentUserName === userName,
          error: USER_NAME_CANNOT_BE_CHANGED
        },
        {
          hookFunc: async ([{ password: hashedPassword }]) =>
            await argon2.verify(hashedPassword, currentPassword),
          error: INVALID_CURRENT_PASSWORD
        }
      ]
    );
  }

  @AllowForSelf()
  deleteUserById({ _id }: _Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, User);
  }

  private static getUserResponse(user: User): UserResponse {
    return {
      ...user,
      extraInfo: 'Some extra info'
    };
  }
}
