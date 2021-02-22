import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserAccount from "./types/entities/UserAccount";
import _Id from "../../backk/types/id/_Id";
import { BackkError } from "../../backk/types/BackkError";
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
import UserAccountService from "./UserAccountService";
import UserName from "../../backk/types/useraccount/UserName";
import MongoDbQuery from "../../backk/dbmanager/mongodb/MongoDbQuery";
import SqlEquals from "../../backk/dbmanager/sql/expressions/SqlEquals";

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserAccountServiceImpl extends UserAccountService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @OnStartUp()
  preloadCities(): Promise<Name[] | BackkError> {
    return getCities();
  }

  @AllowForTests()
  deleteAllUserAccounts(): Promise<BackkError | null> {
    return this.dbManager.deleteAllEntities(UserAccount);
  }

  @AllowForEveryUser()
  async createUserAccount(arg: UserAccount): Promise<UserAccountResponse | BackkError> {
    const userOrErrorResponse = await this.dbManager.createEntity(
      { ...arg, commissionDiscountPercentage: 0 },
      UserAccount
    );

    return UserAccountServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  async getUserAccount({ userName }: UserName): Promise<UserAccountResponse | BackkError> {
    const filters = this.dbManager.getFilters<UserAccount>(
      [
        new MongoDbQuery({ userName }),
        new MongoDbQuery({ state: 'forSale' }, 'favoriteSalesItems')
      ],
      [new SqlEquals({ userName }), new SqlEquals({ state: 'forSale' }, 'favoriteSalesItems')]
    );

    const defaultPostQueryOperations = new DefaultPostQueryOperations();

    const postQueryOperations = {
      ...defaultPostQueryOperations,
      sortBys: [...defaultPostQueryOperations.sortBys, new SortBy('paymentMethods', 'isDefault', 'ASC')]
    };

    const userOrErrorResponse = await this.dbManager.getEntityByFilters(
      filters,
      UserAccount,
      postQueryOperations
    );

    return UserAccountServiceImpl.getUserResponse(userOrErrorResponse);
  }

  async getUserAccountById({ _id }: _Id): Promise<UserAccountResponse | BackkError> {
    const userOrErrorResponse = await this.dbManager.getEntityById(_id, UserAccount);
    return UserAccountServiceImpl.getUserResponse(userOrErrorResponse);
  }

  @AllowForSelf()
  addToFavoriteSalesItems({
    _id,
    favoriteSalesItem
  }: _IdAndFavoriteSalesItem): Promise<UserAccoun[T, BackkError | null]> {
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
  }: _IdAndFavoriteSalesItem): Promise<UserAccoun[T, BackkError | null]> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', favoriteSalesItem._id, UserAccount);
  }

  @AllowForSelf()
  @Update()
  followUser({ _id, version, followedUserId }: _IdAndFollowedUserId): Promise<UserAccoun[T, BackkError | null]> {
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
  unfollowUser({ _id, followedUserId }: _IdAndFollowedUserId): Promise<UserAccoun[T, BackkError | null]> {
    return this.dbManager.removeSubEntityById(_id, 'followedUsers', followedUserId, UserAccount, [
      () => this.dbManager.removeSubEntityById(followedUserId, 'followingUsers', _id, UserAccount)
    ]);
  }

  @AllowForSelf()
  updateUserAccount(arg: UserAccount): Promise<BackkError | null> {
    return this.dbManager.updateEntity(arg, UserAccount);
  }

  @AllowForSelf()
  @Errors([USER_NAME_CANNOT_BE_CHANGED, INVALID_CURRENT_PASSWORD])
  changeUserPassword({
    _id,
    currentPassword,
    password,
    userName
  }: ChangeUserPasswordArg): Promise<BackkError | null> {
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
  deleteUserAccount({ _id }: _Id): Promise<BackkError | null> {
    return this.dbManager.deleteEntityById(_id, UserAccount);
  }

  @AllowForEveryUser()
  @Metadata()
  getCities(): Promise<Name[] | BackkError> {
    return Promise.resolve(getCities());
  }

  private static getUserResponse(
    userOrErrorResponse: UserAccoun[T, BackkError | null]
  ): UserAccountResponse | BackkError {
    return 'errorMessage' in userOrErrorResponse
      ? userOrErrorResponse
      : {
          ...userOrErrorResponse,
          extraInfo: 'Some extra info'
        };
  }
}
