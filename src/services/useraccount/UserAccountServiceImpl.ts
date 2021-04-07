import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserAccount from './types/entities/UserAccount';
import _Id from '../../backk/types/id/_Id';
import ChangeUserPasswordArg from './types/args/ChangeUserPasswordArg';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { Update } from '../../backk/decorators/service/function/Update';
import { Name } from '../../backk/types/Name';
import getCities from './validation/getCities';
import { OnStartUp } from '../../backk/decorators/service/function/OnStartUp';
import { Metadata } from '../../backk/decorators/service/function/Metadata';
import UserAccountService from './UserAccountService';
import UserName from '../../backk/types/useraccount/UserName';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import { SalesItem } from '../salesitem/types/entities/SalesItem';
import GetUserAccountArg from './types/args/GetUserAccountArg';
import _IdAndSalesItemId from './types/args/_IdAndSalesItemId';
import _IdAndFollowedUserAccountId from './types/args/_IdAndFollowedUserAccountId';
import FollowedUserAccount from './types/entities/FollowedUserAccount';
import FollowingUserAccount from './types/entities/FollowingUserAccount';
import { userAccountServiceErrors } from './errors/userAccountServiceErrors';

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserAccountServiceImpl extends UserAccountService {
  constructor(dbManager: AbstractDbManager) {
    super(userAccountServiceErrors, dbManager);
  }

  @OnStartUp()
  preloadCities(): PromiseErrorOr<Name[]> {
    return getCities();
  }

  @AllowForTests()
  deleteAllUserAccounts(): PromiseErrorOr<null> {
    return this.dbManager.deleteAllEntities(UserAccount);
  }

  @AllowForEveryUser()
  createUserAccount(userAccount: UserAccount): PromiseErrorOr<UserAccount> {
    return this.dbManager.createEntity(UserAccount, {
      ...userAccount,
      commissionDiscountPercentage: 0,
      isLocked: false
    }, {
      postQueryOperations: {
        includeResponseFields: ["_id", "commissionDiscountPercentage"]
      }
    });
  }

  getUserNameById({ _id }: _Id): PromiseErrorOr<UserName> {
    return this.dbManager.getEntityById(UserAccount, _id, {
      postQueryOperations: { includeResponseFields: ["userName"] }
    });
  }

  @AllowForSelf()
  getUserAccount({ userName, ...postQueryOperations }: GetUserAccountArg): PromiseErrorOr<UserAccount> {
    return this.dbManager.getEntityByFilters(UserAccount, {
      userName,
      "favoriteSalesItems.state": "forSale"
    }, {
      postQueryOperations
    });
  }

  @AllowForSelf()
  @Update('addOrRemove')
  followUser({ _id, followedUserAccountId }: _IdAndFollowedUserAccountId): PromiseErrorOr<null> {
    return this.dbManager.addSubEntityToEntityById(FollowedUserAccount, { _id: followedUserAccountId }, UserAccount, _id, "followedUserAccounts", {
      entityPreHooks: () =>
        this.dbManager.addSubEntityToEntityById(FollowingUserAccount, { _id }, UserAccount, followedUserAccountId, "followingUserAccounts")
    });
  }

  @AllowForSelf()
  @Update('addOrRemove')
  unfollowUser({ _id, followedUserAccountId }: _IdAndFollowedUserAccountId): PromiseErrorOr<null> {
    return this.dbManager.removeSubEntityFromEntityById(_id, UserAccount, "followedUserAccounts", followedUserAccountId, {
      entityPreHooks: () =>
        this.dbManager.removeSubEntityFromEntityById(followedUserAccountId, UserAccount, "followingUserAccounts", _id)
    });
  }

  @AllowForSelf()
  @Update('addOrRemove')
  addToFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseErrorOr<null> {
    return this.dbManager.addSubEntityToEntityById(SalesItem, { _id: salesItemId }, UserAccount, _id, "favoriteSalesItems");
  }

  @AllowForSelf()
  @Update('addOrRemove')
  removeFromFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseErrorOr<null> {
    return this.dbManager.removeSubEntityFromEntityById(_id, UserAccount, "favoriteSalesItems", salesItemId);
  }

  @AllowForSelf()
  updateUserAccount(userAccount: UserAccount): PromiseErrorOr<null> {
    return this.dbManager.updateEntity(userAccount, UserAccount);
  }

  @AllowForSelf()
  changeUserPassword({
    _id,
    userName,
    currentPassword,
    newPassword,
    repeatNewPassword
  }: ChangeUserPasswordArg): PromiseErrorOr<null> {
    return this.dbManager.updateEntity({ _id, password: newPassword }, UserAccount, {
      entityPreHooks: [
        {
          shouldSucceedOrBeTrue: ({ userName: currentUserName }) => userName === currentUserName,
          error: userAccountServiceErrors.invalidUserName
        },
        {
          shouldSucceedOrBeTrue: ({ password: hashedCurrentPassword }) =>
            argon2.verify(hashedCurrentPassword, currentPassword),
          error: userAccountServiceErrors.invalidCurrentPassword
        },
        {
          shouldSucceedOrBeTrue: async ({ password: hashedCurrentPassword }) => {
            return !(await argon2.verify(hashedCurrentPassword, newPassword));
          },
          error: userAccountServiceErrors.newPasswordCannotBeSameAsCurrentPassword
        },
        {
          shouldSucceedOrBeTrue: async () => newPassword === repeatNewPassword,
          error: userAccountServiceErrors.newPasswordAndRepeatNewPasswordDoNotMatch
        }
      ]
    });
  }

  @AllowForSelf()
  deleteUserAccount({ _id }: _Id): PromiseErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, UserAccount);
  }

  @AllowForEveryUser()
  @Metadata()
  getCities(): PromiseErrorOr<Name[]> {
    return getCities();
  }
}
