import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
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
import { Update } from "../../backk/decorators/service/function/Update";
import _IdAndFollowedUserId from "./types/args/_IdAndFollowedUserId";
import { ExpectReturnValueToContainInTests } from "../../backk/decorators/service/function/ExpectReturnValueToContainInTests";
import { Name } from "../../backk/types/Name";
import getCities from "./validation/getCities";
import { OnStartUp } from "../../backk/decorators/service/function/OnStartUp";
import { Metadata } from "../../backk/decorators/service/function/Metadata";
import GetUsersArg from "./types/args/GetUsersArg";
import SqlExpression from "../../backk/dbmanager/sql/expressions/SqlExpression";
import DefaultPostQueryOperations from "../../backk/types/postqueryoperations/DefaultPostQueryOperations";
import SortBy from "../../backk/types/postqueryoperations/SortBy";
import PublicUser from "./types/entities/PublicUser";
import FavoriteSalesItem from "./types/entities/FavoriteSalesItem";
import _IdAndFavoriteSalesItem from "./types/args/_IdAndFavoriteSalesItem";

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UsersServiceImpl extends UsersService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @OnStartUp()
  preloadCities(): Promise<Name[] | ErrorResponse> {
    return getCities();
  }

  @AllowForTests()
  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(User);
  }

  @AllowForEveryUser()
  async createUser(arg: User): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.createEntity(
      { ...arg, commissionDiscountPercentage: 0 },
      User
    );

    return UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForEveryUser()
  getUsers({
    displayNameFilter,
    ...postQueryOperations
  }: GetUsersArg): Promise<PublicUser[] | ErrorResponse> {
    const filters = this.dbManager.getFilters<PublicUser>(
      {
        displayName: new RegExp(displayNameFilter)
      },
      [
        new SqlExpression('displayname LIKE :displayNameFilter', {
          displayNameFilter: `%${displayNameFilter}%`
        })
      ]
    );

    return this.dbManager.getEntitiesByFilters(filters, PublicUser, postQueryOperations);
  }

  @AllowForSelf()
  async getUser({ userName }: UserName): Promise<UserResponse | ErrorResponse> {
    const defaultPostQueryOperations = new DefaultPostQueryOperations();

    const userOrErrorResponse = await this.dbManager.getEntityWhere('userName', userName, User, {
      ...defaultPostQueryOperations,
      sortBys: [...defaultPostQueryOperations.sortBys, new SortBy('paymentMethods', 'isDefault', 'ASC')]
    });

    return UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  async getUserById({ _id }: _Id): Promise<UserResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityById(_id, User);
    return UsersServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  addToFavoriteSalesItems({
    _id,
    favoriteSalesItem
  }: _IdAndFavoriteSalesItem): Promise<User | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      'any',
      'favoriteSalesItems',
      favoriteSalesItem,
      User,
      FavoriteSalesItem
    );
  }

  @AllowForSelf()
  removeFromFavoriteSalesItems({
    _id,
    favoriteSalesItem
  }: _IdAndFavoriteSalesItem): Promise<User | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', favoriteSalesItem._id, User);
  }

  @AllowForSelf()
  @Update()
  followUser({ _id, version, followedUserId }: _IdAndFollowedUserId): Promise<User | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      version,
      'followedUsers',
      { _id: followedUserId },
      User,
      PublicUser,
      () => this.dbManager.addSubEntity(followedUserId, 'any', 'followingUsers', { _id }, User, PublicUser)
    );
  }

  @AllowForSelf()
  @Update()
  @ExpectReturnValueToContainInTests({ followedUsers: [] })
  unfollowUser({ _id, followedUserId }: _IdAndFollowedUserId): Promise<User | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'followedUsers', followedUserId, User, [
      () => this.dbManager.removeSubEntityById(followedUserId, 'followingUsers', _id, User)
    ]);
  }

  @AllowForSelf()
  updateUser(arg: User): Promise<void | ErrorResponse> {
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
        isSuccessfulOrTrue: (currentEntity) => currentEntity.userName === userName,
        errorMessage: USER_NAME_CANNOT_BE_CHANGED
      },
      {
        isSuccessfulOrTrue: async ({ password: hashedPassword }) =>
          await argon2.verify(hashedPassword, currentPassword),
        errorMessage: INVALID_CURRENT_PASSWORD,
        shouldDisregardFailureWhenExecutingTests: true
      }
    ]);
  }

  @AllowForSelf()
  deleteUser({ _id }: _Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, User);
  }

  @AllowForEveryUser()
  @Metadata()
  getCities(): Promise<Name[] | ErrorResponse> {
    return Promise.resolve(getCities());
  }

  private static getUserResponse(userOrErrorResponse: User | ErrorResponse): UserResponse | ErrorResponse {
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : {
          ...userOrErrorResponse,
          extraInfo: 'Some extra info'
        };
  }
}
