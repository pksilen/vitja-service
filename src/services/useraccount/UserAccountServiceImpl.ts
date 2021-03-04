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
import { Name } from "../../backk/types/Name";
import getCities from "./validation/getCities";
import { OnStartUp } from "../../backk/decorators/service/function/OnStartUp";
import { Metadata } from "../../backk/decorators/service/function/Metadata";
import UserAccountService from "./UserAccountService";
import UserName from "../../backk/types/useraccount/UserName";
import MongoDbQuery from "../../backk/dbmanager/mongodb/MongoDbQuery";
import SqlEquals from "../../backk/dbmanager/sql/expressions/SqlEquals";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import { SalesItem } from "../salesitem/types/entities/SalesItem";
import GetUserAccountArg from "./types/args/GetUserAccountArg";
import _IdAndSalesItemId from "./types/args/_IdAndSalesItemId";
import FollowedUser from "./types/entities/FollowedUser";
import FollowingUser from "./types/entities/FollowingUser";
import FollowUserArg from "./types/args/FollowUserArg";
import UnfollowUserArg from "./types/args/UnfollowUserArg";
import { TestAfter } from "../../backk/decorators/service/function/TestAfter";

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
    return this.dbManager.createEntity({ ...arg, commissionDiscountPercentage: 0 }, UserAccount, {
      postQueryOperations: {
        excludeResponseFields: [
          'favoriteSalesItems',
          'ownSalesItems',
          'orders',
          'followedUsers',
          'followingUsers'
        ]
      }
    });
  }

  @AllowForSelf()
  @Update()
  followUser({ _id, followedUserAccountId }: FollowUserArg): PromiseOfErrorOr<null> {
    return this.dbManager.addSubEntity(
      _id,
      'followedUsers',
      { _id: followedUserAccountId },
      UserAccount,
      FollowedUser,
      {
        preHooks: () =>
          this.dbManager.addSubEntity(
            followedUserAccountId,
            'followingUsers',
            { _id },
            UserAccount,
            FollowingUser
          )
      }
    );
  }

  @AllowForSelf()
  @Update()
  unfollowUser({ _id, followedUserAccountId }: UnfollowUserArg): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'followedUsers', followedUserAccountId, UserAccount, {
      preHooks: () =>
        this.dbManager.removeSubEntityById(followedUserAccountId, 'followingUsers', _id, UserAccount)
    });
  }

  @AllowForSelf()
  @TestAfter('salesItemService.createSalesItem')
  addToFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.addSubEntity(
      _id,
      'favoriteSalesItems',
      { _id: salesItemId },
      UserAccount,
      SalesItem
    );
  }

  @AllowForSelf()
  @TestAfter('salesItemService.createSalesItem')
  removeFromFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', salesItemId, UserAccount);
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
    return this.dbManager.updateEntity({ _id, password }, UserAccount, {
      preHooks: [
        {
          isSuccessfulOrTrue: (currentEntity) => currentEntity.userName === userName,
          errorMessage: USER_NAME_CANNOT_BE_CHANGED
        },
        {
          isSuccessfulOrTrue: ({ password: hashedPassword }) =>
            argon2.verify(hashedPassword, currentPassword),
          errorMessage: INVALID_CURRENT_PASSWORD,
          shouldDisregardFailureWhenExecutingTests: true
        }
      ]
    });
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
