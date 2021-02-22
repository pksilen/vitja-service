import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserName from "./types/args/UserName";
import UserAccount from "./types/entities/UserAccount";
import UserAccountService from "./UserAccountsService";
import _Id from "../../backk/types/id/_Id";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import { INVALID_CURRENT_PASSWORD, USER_NAME_CANNOT_BE_CHANGED } from "./errors/userAccountServiceErrors";
import { Errors } from "../../backk/decorators/service/function/Errors";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { Update } from "../../backk/decorators/service/function/Update";
import _IdAndFollowedUserId from "./types/args/_IdAndFollowedUserId";
import { ExpectReturnValueToContainInTests } from "../../backk/decorators/service/function/ExpectReturnValueToContainInTests";
import { Name } from "../../backk/types/Name";
import getCities from "./validation/getCities";
import { OnStartUp } from "../../backk/decorators/service/function/OnStartUp";
import { Metadata } from "../../backk/decorators/service/function/Metadata";
import DefaultPostQueryOperations from "../../backk/types/postqueryoperations/DefaultPostQueryOperations";
import SortBy from "../../backk/types/postqueryoperations/SortBy";
import FavoriteSalesItem from "./types/entities/FavoriteSalesItem";
import _IdAndFavoriteSalesItem from "./types/args/_IdAndFavoriteSalesItem";
import UserAccountResponse from "./types/responses/UserAccountResponse";
import FollowUser from "./types/entities/FollowUser";

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserAccountServiceImpl extends UserAccountService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @OnStartUp()
  preloadCities(): Promise<Name[] | ErrorResponse> {
    return getCities();
  }

  @AllowForTests()
  deleteAllUsers(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(UserAccount);
  }

  @AllowForEveryUser()
  async createUser(arg: UserAccount): Promise<UserAccountResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.createEntity(
      { ...arg, commissionDiscountPercentage: 0 },
      UserAccount
    );

    return UserAccountServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  async getUser({ userName }: UserName): Promise<UserAccountResponse | ErrorResponse> {
    const defaultPostQueryOperations = new DefaultPostQueryOperations();

    const userOrErrorResponse = await this.dbManager.getEntityWhere('userName', userName, UserAccount, {
      ...defaultPostQueryOperations,
      sortBys: [...defaultPostQueryOperations.sortBys, new SortBy('paymentMethods', 'isDefault', 'ASC')]
    });

    return UserAccountServiceImpl.getUserResponse(userOrErrorResponse);
  }

  async getUserAccountById({ _id }: _Id): Promise<UserAccountResponse | ErrorResponse> {
    const userOrErrorResponse = await this.dbManager.getEntityById(_id, UserAccount);
    return UserAccountServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  addToFavoriteSalesItems({
    _id,
    favoriteSalesItem
  }: _IdAndFavoriteSalesItem): Promise<UserAccount | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      'any',
      'favoriteSalesItems',
      favoriteSalesItem,
      UserAccount,
      FavoriteSalesItem
    );
  }

  @AllowForSelf()
  removeFromFavoriteSalesItems({
    _id,
    favoriteSalesItem
  }: _IdAndFavoriteSalesItem): Promise<UserAccount | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', favoriteSalesItem._id, UserAccount);
  }

  @AllowForSelf()
  @Update()
  followUser({ _id, version, followedUserId }: _IdAndFollowedUserId): Promise<UserAccount | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      version,
      'followedUsers',
      { _id: followedUserId },
      UserAccount,
      FollowUser,
      () =>
        this.dbManager.addSubEntity(followedUserId, 'any', 'followingUsers', { _id }, UserAccount, FollowUser)
    );
  }

  @AllowForSelf()
  @Update()
  @ExpectReturnValueToContainInTests({ followedUsers: [] })
  unfollowUser({ _id, followedUserId }: _IdAndFollowedUserId): Promise<UserAccount | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'followedUsers', followedUserId, UserAccount, [
      () => this.dbManager.removeSubEntityById(followedUserId, 'followingUsers', _id, UserAccount)
    ]);
  }

  @AllowForSelf()
  updateUser(arg: UserAccount): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(arg, UserAccount);
  }

  @AllowForSelf()
  @Errors([USER_NAME_CANNOT_BE_CHANGED, INVALID_CURRENT_PASSWORD])
  changeUserPassword({
    _id,
    currentPassword,
    password,
    userName
  }: ChangeUserPasswordArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity({ _id, password }, UserAccount, [
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
    return this.dbManager.deleteEntityById(_id, UserAccount);
  }

  @AllowForEveryUser()
  @Metadata()
  getCities(): Promise<Name[] | ErrorResponse> {
    return Promise.resolve(getCities());
  }

  private static getUserResponse(
    userOrErrorResponse: UserAccount | ErrorResponse
  ): UserAccountResponse | ErrorResponse {
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : {
          ...userOrErrorResponse,
          extraInfo: 'Some extra info'
        };
  }
}
