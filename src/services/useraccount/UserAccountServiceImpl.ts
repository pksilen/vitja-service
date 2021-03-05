import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserAccount from './types/entities/UserAccount';
import _Id from '../../backk/types/id/_Id';
import ChangeUserPasswordArg from './types/args/ChangeUserPasswordArg';
import { INVALID_CURRENT_PASSWORD, USER_NAME_CANNOT_BE_CHANGED } from './errors/userAccountServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
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
import { TestAfter } from '../../backk/decorators/service/function/TestAfter';
import { ExpectAfterThisOperationEntityToContainInTests } from '../../backk/decorators/service/function/ExpectAfterThisOperationEntityToContainInTests';
import FollowedUserAccount from './types/entities/FollowedUserAccount';
import FollowingUserAccount from './types/entities/FollowingUserAccount';

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
          'followedUserAccounts',
          'followingUserAccounts'
        ]
      }
    });
  }

  getUserNameById({ _id }: _Id): PromiseOfErrorOr<UserName> {
    return this.dbManager.getEntityById(_id, UserAccount, {
      includeResponseFields: ['userName']
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
  @Update()
  @ExpectAfterThisOperationEntityToContainInTests({ 'followedUserAccounts._id': '{{followedUserAccountId}}' })
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
  @Update()
  @ExpectAfterThisOperationEntityToContainInTests({ followedUserAccounts: [] })
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
  @Update()
  @TestAfter('salesItemService.createSalesItem')
  @ExpectAfterThisOperationEntityToContainInTests({ 'favoriteSalesItems._id': '{{salesItemId}}' })
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
  @Update()
  @TestAfter('salesItemService.createSalesItem')
  @ExpectAfterThisOperationEntityToContainInTests({ favoriteSalesItems: [] })
  removeFromFavoriteSalesItems({ _id, salesItemId }: _IdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'favoriteSalesItems', salesItemId, UserAccount);
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
