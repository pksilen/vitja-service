import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserAccount from "./types/entities/UserAccount";
import _Id from "../../backk/types/id/_Id";
import ChangeUserPasswordArg from "./types/args/ChangeUserPasswordArg";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { Update } from "../../backk/decorators/service/function/Update";
import { Name } from "../../backk/types/Name";
import getCities from "./validation/getCities";
import { OnStartUp } from "../../backk/decorators/service/function/OnStartUp";
import { Metadata } from "../../backk/decorators/service/function/Metadata";
import UserAccountService from "./UserAccountService";
import UserName from "../../backk/types/useraccount/UserName";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import { SalesItem } from "../salesitem/types/entities/SalesItem";
import GetUserAccountArg from "./types/args/GetUserAccountArg";
import _IdAndSalesItemId from "./types/args/_IdAndSalesItemId";
import _IdAndFollowedUserAccountId from "./types/args/_IdAndFollowedUserAccountId";
import FollowedUserAccount from "./types/entities/FollowedUserAccount";
import FollowingUserAccount from "./types/entities/FollowingUserAccount";
import { userAccountServiceErrors } from "./errors/userAccountServiceErrors";

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserAccountServiceImpl extends UserAccountService {
  constructor(dbManager: AbstractDbManager) {
    super(userAccountServiceErrors, dbManager);
  }

  @OnStartUp()
  preloadCities(): PromiseOfErrorOr<Name[]> {
    return getCities();
  }

  @AllowForTests()
  deleteAllUserAccounts(): PromiseOfErrorOr<null> {
    return this.dbManager.deleteAllEntities(UserAccount);
  }

  @AllowForEveryUser()
  createUserAccount(userAccount: UserAccount): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.createEntity(
      { ...userAccount, commissionDiscountPercentage: 0, isLocked: false },
      UserAccount,
      {
        postQueryOperations: {
          includeResponseFields: ['_id', 'commissionDiscountPercentage']
        }
      }
    );
  }

  getUserNameById({ _id }: _Id): PromiseOfErrorOr<UserName> {
    return this.dbManager.getEntityById(_id, UserAccount, {
      postQueryOperations: { includeResponseFields: ['userName'] }
    });
  }

  @AllowForSelf()
  getUserAccount({ userName, ...postQueryOperations }: GetUserAccountArg): PromiseOfErrorOr<UserAccount> {
    return this.dbManager.getEntityByFilters(
      { userName, 'favoriteSalesItems.state': 'forSale' },
      UserAccount,
      postQueryOperations
    );
  }

  @AllowForSelf()
  @Update('addOrRemove')
  followUser({ _id, followedUserAccountId }: _IdAndFollowedUserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.addSubEntity(
      _id,
      'followedUserAccounts',
      { _id: followedUserAccountId },
      UserAccount,
      FollowedUserAccount,
      {
        preHooks: () =>
          this.dbManager.addSubEntity(
            followedUserAccountId,
            'followingUserAccounts',
            { _id },
            UserAccount,
            FollowingUserAccount
          )
      }
    );
  }

  @AllowForSelf()
  @Update('addOrRemove')
  unfollowUser({ _id, followedUserAccountId }: _IdAndFollowedUserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(
      _id,
      'followedUserAccounts',
      followedUserAccountId,
      UserAccount,
      {
        preHooks: () =>
          this.dbManager.removeSubEntityById(followedUserAccountId, 'followingUserAccounts', _id, UserAccount)
      }
    );
  }

  @AllowForSelf()
  @Update('addOrRemove')
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
  @Update('addOrRemove')
  removeFromFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', salesItemId, UserAccount);
  }

  @AllowForSelf()
  updateUserAccount(userAccount: UserAccount): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(userAccount, UserAccount);
  }

  @AllowForSelf()
  changeUserPassword({
    _id,
    userName,
    currentPassword,
    newPassword,
    repeatNewPassword
  }: ChangeUserPasswordArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity({ _id, password: newPassword }, UserAccount, {
      preHooks: [
        {
          isSuccessfulOrTrue: ({ userName: currentUserName }) => userName === currentUserName,
          error: userAccountServiceErrors.invalidUserName
        },
        {
          isSuccessfulOrTrue: async ({ password: hashedCurrentPassword }) => {
            return !(await argon2.verify(hashedCurrentPassword, newPassword));
          },
          error: userAccountServiceErrors.newPasswordCannotBeSameAsCurrentPassword
        },
        {
          isSuccessfulOrTrue: async () => newPassword === repeatNewPassword,
          error: userAccountServiceErrors.newPasswordAndRepeatNewPasswordDoNotMatch
        },
        {
          isSuccessfulOrTrue: ({ password: hashedCurrentPassword }) =>
            argon2.verify(hashedCurrentPassword, currentPassword),
          error: userAccountServiceErrors.invalidCurrentPassword
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
    return getCities();
  }
}
