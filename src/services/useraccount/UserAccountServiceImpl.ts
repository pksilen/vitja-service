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
import MongoDbQuery from '../../backk/dbmanager/mongodb/MongoDbQuery';
import SqlEquals from '../../backk/dbmanager/sql/expressions/SqlEquals';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';
import { SalesItem } from '../salesitem/types/entities/SalesItem';
import GetUserAccountArg from './types/args/GetUserAccountArg';
import _IdAndSalesItemId from './types/args/_IdAndSalesItemId';
import _IdAndFollowedUserAccountId from './types/args/_IdAndFollowedUserAccountId';
import { PostTest } from '../../backk/decorators/service/function/PostTest';
import FollowedUserAccount from './types/entities/FollowedUserAccount';
import FollowingUserAccount from './types/entities/FollowingUserAccount';
import { userAccountServiceErrors } from './errors/userAccountServiceErrors';
import { TestSetup } from '../../backk/decorators/service/function/TestSetup';

@AllowServiceForUserRoles(['vitjaAdmin'])
@Injectable()
export default class UserAccountServiceImpl extends UserAccountService {
  constructor(dbManager: AbstractDbManager) {
    super(userAccountServiceErrors, dbManager);
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
          'followedUserAccounts',
          'followingUserAccounts'
        ]
      }
    });
  }

  getUserNameById({ _id }: _Id): PromiseOfErrorOr<UserName> {
    return this.dbManager.getEntityById(_id, UserAccount, {
      postQueryOperations: { includeResponseFields: ['userName'] }
    });
  }

  @AllowForSelf()
  getUserAccount({ userName, ...postQueryOperations }: GetUserAccountArg): PromiseOfErrorOr<UserAccount> {
    const filters = this.dbManager.getFilters<UserAccount>(
      [new MongoDbQuery({ userName }), new MongoDbQuery({ state: 'forSale' }, 'favoriteSalesItems')],
      [new SqlEquals({ userName }), new SqlEquals({ state: 'forSale' }, 'favoriteSalesItems')]
    );

    return this.dbManager.getEntityByFilters(filters, UserAccount, postQueryOperations);
  }

  @AllowForSelf()
  @Update('addOrRemoveSubEntities')
  @TestSetup([
    {
      setupStepName: 'create followed user account',
      serviceFunctionName: 'userAccountService.createUserAccount',
      argument: { userName: 'test2@test.com' },
      postmanTests: ['pm.collectionVariables.set("followedUserAccountId", response._id)']
    }
  ])
  @PostTest({
    testName: 'expect user account to follow a another user account',
    serviceFunctionName: 'userAccountService.getUserAccount',
    expectedResult: {
      'followedUserAccounts._id': '{{followedUserAccountId}}'
    }
  })
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
  @Update('addOrRemoveSubEntities')
  @PostTest({
    testName: 'expect no followed user accounts',
    serviceFunctionName: 'userAccountService.getUserAccount',
    expectedResult: { followedUserAccounts: [] }
  })
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
  @Update('addOrRemoveSubEntities')
  @TestSetup(['salesItemService.createSalesItem'])
  @PostTest({
    testName: 'expect a favorite sales item in user account',
    serviceFunctionName: 'userAccountService.getUserAccount',
    expectedResult: {
      'favoriteSalesItems._id': '{{salesItemId}}'
    }
  })
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
  @Update('addOrRemoveSubEntities')
  @PostTest({
    testName: 'expect no favorite sales items in user account',
    serviceFunctionName: 'userAccountService.getUserAccount',
    expectedResult: {
      favoriteSalesItems: []
    }
  })
  removeFromFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', salesItemId, UserAccount);
  }

  @AllowForSelf()
  updateUserAccount(arg: UserAccount): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(arg, UserAccount);
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
          error: userAccountServiceErrors.invalidUserNameError
        },
        {
          isSuccessfulOrTrue: async ({ password: hashedCurrentPassword }) => {
            return !(await argon2.verify(hashedCurrentPassword, newPassword));
          },
          error: userAccountServiceErrors.newPasswordCannotBeSameAsCurrentPasswordError
        },
        {
          isSuccessfulOrTrue: async () => newPassword === repeatNewPassword,
          error: userAccountServiceErrors.newPasswordAndRepeatNewPasswordDoNotMatchError
        },
        {
          isSuccessfulOrTrue: ({ password: hashedCurrentPassword }) =>
            argon2.verify(hashedCurrentPassword, currentPassword),
          error: userAccountServiceErrors.invalidCurrentPasswordError
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
