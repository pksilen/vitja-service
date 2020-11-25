import { Injectable, Optional } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import { FunctionDocumentation } from "../../backk/decorators/service/function/FunctionDocumentation";
import { Private } from "../../backk/decorators/service/function/Private";
import ServiceDocumentation from "../../backk/decorators/service/ServiceDocumentation";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import CreateUserArg from "./types/args/CreateUserArg";
import UpdateUserArg from "./types/args/UpdateUserArg";
import UserName from "./types/args/UserName";
import User from "./types/entities/User";
import UserResponse from "./types/responses/UserResponse";
import UsersService from "./UsersService";
import _Id from "../../backk/types/id/_Id";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import DefaultPaymentMethod from "./types/entities/DefaultPaymentMethod";
import PaymentMethod from "./types/entities/PaymentMethod";
import { INVALID_CURRENT_PASSWORD, USER_NAME_CANNOT_BE_CHANGED } from "./errors/usersServiceErrors";
import { Errors } from "../../backk/decorators/service/function/Errors";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";

@ServiceDocumentation('Users service doc goes here...')
@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(
    dbManager: AbstractDbManager,
    @Optional()
    Types = {
      ChangeUserPasswordArg,
      DefaultPaymentMethod,
      PaymentMethod,
      UpdateUserArg,
      User,
      UserName,
      CreateUserArg,
      UserResponse
    }
  ) {
    super(dbManager, Types);
  }

  @AllowForTests()
  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(User);
  }

  @FunctionDocumentation('createUser function doc goes here...')
  @AllowForEveryUser()
  async createUser(arg: CreateUserArg): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.createEntity(arg, User);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  async getUserByUserName({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityBy('userName', userName, User);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @Private()
  async getUserById({ _id }: _Id): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityById(_id, User);
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  updateUser(arg: UpdateUserArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(arg, User);
  }

  @AllowForSelf()
  @Errors([USER_NAME_CANNOT_BE_CHANGED, INVALID_CURRENT_PASSWORD])
  changeUserPassword({
    _id,
    currentPassword,
    password,
    userName
  }: ChangeUserPasswordArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity({ _id, password }, User, [
      {
        currentEntityJsonPath: 'userName',
        hookFunc: ([currentUserName]) => currentUserName === userName,
        error: USER_NAME_CANNOT_BE_CHANGED
      },
      {
        currentEntityJsonPath: 'password',
        hookFunc: async ([hashedPassword]) => await argon2.verify(hashedPassword, currentPassword),
        error: INVALID_CURRENT_PASSWORD
      }
    ]);
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
