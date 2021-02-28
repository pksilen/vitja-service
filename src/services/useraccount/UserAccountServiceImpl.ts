import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserAccount from "./types/entities/UserAccount";
import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import { INVALID_CURRENT_PASSWORD, USER_NAME_CANNOT_BE_CHANGED } from "./errors/userAccountServiceErrors";
import { Errors } from "../../backk/decorators/service/function/Errors";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { Update } from "../../backk/decorators/service/function/Update";
import _IdAndFollowedUserAccountId from "./types/args/_IdAndFollowedUserAccountId";
import { ExpectReturnValueToContainInTests } from "../../backk/decorators/service/function/ExpectReturnValueToContainInTests";
import { Name } from "../../backk/types/Name";
import getCities from "./validation/getCities";
import { OnStartUp } from "../../backk/decorators/service/function/OnStartUp";
import { Metadata } from "../../backk/decorators/service/function/Metadata";
import _IdAndSalesItemId from "./types/args/_IdAndSalesItemId";
import FollowUser from "./types/entities/FollowUser";
import UserAccountService from "./UserAccountService";
import UserName from "../../backk/types/useraccount/UserName";
import MongoDbQuery from "../../backk/dbmanager/mongodb/MongoDbQuery";
import SqlEquals from "../../backk/dbmanager/sql/expressions/SqlEquals";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import { SalesItem } from "../salesitem/types/entities/SalesItem";
import GetUserAccountArg from "./types/args/GetUserAccountArg";

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserAccountServiceImpl extends UserAccountService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @OnStartUp()
  preloadCities(): PromiseOfErrorOr<Name[]> {
    return Promise.resolve(getCities());
  }

  @AllowForTests()
  deleteAllUserAccounts(): PromiseOfErrorOr<null> {
    return this.dbManager.deleteAllEntities(UserAccount);
  }

  @AllowForEveryUser()
  createUserAccount(arg: UserAccount): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.createEntity({ ...arg, commissionDiscountPercentage: 0 }, UserAccount);
  }

  @AllowForSelf()
  getUserAccount({ userName, ...postQueryOperations }: GetUserAccountArg): PromiseOfErrorOr<UserAccount> {
    const filters = this.dbManager.getFilters<UserAccount>(
      [new MongoDbQuery({ userName }), new MongoDbQuery({ state: 'forSale' }, 'favoriteSalesItems')],
      [new SqlEquals({ userName }), new SqlEquals({ state: 'forSale' }, 'favoriteSalesItems')]
    );

    return this.dbManager.getEntityByFilters(filters, UserAccount, postQueryOperations);
  }

  getUserNameById({ _id }: _Id): PromiseOfErrorOr<UserName> {
    return this.dbManager.getEntityById(_id, UserAccount, {
      includeResponseFields: ['userName']
    });
  }

  @AllowForSelf()
  addToFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.addSubEntity(
      _id,
      'any',
      'favoriteSalesItems',
      { _id: salesItemId },
      UserAccount,
      SalesItem,
      { postQueryOperations: this.defaultPostQueryOperations }
    );
  }

  @AllowForSelf()
  removeFromFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', salesItemId, UserAccount, {
      postQueryOperations: this.defaultPostQueryOperations
    });
  }

  @AllowForSelf()
  @Update()
  followUser({
    _id,
    version,
    followedUserAccountId
  }: _IdAndFollowedUserAccountId): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.addSubEntity(
      _id,
      version,
      'followedUsers',
      { _id: followedUserAccountId },
      UserAccount,
      FollowUser,
      {
        preHooks: () =>
          this.dbManager.addSubEntity(
            followedUserAccountId,
            'any',
            'followingUsers',
            { _id },
            UserAccount,
            FollowUser
          ),
        postQueryOperations: this.defaultPostQueryOperations
      }
    );
  }

  @AllowForSelf()
  @Update()
  @ExpectReturnValueToContainInTests({ followedUsers: [] })
  unfollowUser({ _id, followedUserAccountId }: _IdAndFollowedUserAccountId): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.removeSubEntityById(_id, 'followedUsers', followedUserAccountId, UserAccount, {
      preHooks: () =>
        this.dbManager.removeSubEntityById(followedUserAccountId, 'followingUsers', _id, UserAccount),
      postQueryOperations: this.defaultPostQueryOperations
    });
  }

  @AllowForSelf()
  updateUserAccount(arg: UserAccount): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(arg, UserAccount);
  }

  @AllowForSelf()
  @Errors([USER_NAME_CANNOT_BE_CHANGED, INVALID_CURRENT_PASSWORD])
  changeUserPassword({
    _id,
    currentPassword,
    password,
    userName
  }: ChangeUserPasswordArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity({ _id, password }, UserAccount, [
      {
        isSuccessfulOrTrue: (currentEntity) => currentEntity.userName === userName,
        errorMessage: USER_NAME_CANNOT_BE_CHANGED
      },
      {
        isSuccessfulOrTrue: ({ password: hashedPassword }) => argon2.verify(hashedPassword, currentPassword),
        errorMessage: INVALID_CURRENT_PASSWORD,
        shouldDisregardFailureWhenExecutingTests: true
      }
    ]);
  }

  @AllowForSelf()
  deleteUserAccount({ _id }: _Id): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, UserAccount);
  }

  @AllowForEveryUser()
  @Metadata()
  getCities(): PromiseOfErrorOr<Name[]> {
    return Promise.resolve(getCities());
  }
}
