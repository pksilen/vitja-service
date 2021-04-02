import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import SqlEquals from '../../backk/dbmanager/sql/expressions/SqlEquals';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import SqlInExpression from '../../backk/dbmanager/sql/expressions/SqlInExpression';
import SalesItemService from './SalesItemService';
import GetSalesItemsArg from './types/args/GetSalesItemsArg';
import { SalesItem } from './types/entities/SalesItem';
import _Id from '../../backk/types/id/_Id';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { SalesItemState } from './types/enums/SalesItemState';
import GetSalesItemsByUserDefinedFiltersArg from './types/args/GetSalesItemsByUserDefinedFiltersArg';
import DefaultPostQueryOperations from '../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import { CronJob } from '../../backk/decorators/service/function/CronJob';
import DeleteOldUnsoldSalesItemsArg from './types/args/DeleteOldUnsoldSalesItemsArg';
import dayjs from 'dayjs';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';
import User from '../user/types/entities/User';
import FollowedUserSalesItem from './types/responses/FollowedUserSalesItem';
import ShoppingCartOrOrderSalesItem from '../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem';
import executeForAll from '../../backk/utils/executeForAll';
import ChangeExpiredReservedSalesItemStatesToForSaleArg from './types/args/ChangeExpiredReservedSalesItemStatesToForSaleArg';
import { salesItemServiceErrors } from './errors/salesItemServiceErrors';
import { TestSetup } from '../../backk/decorators/service/function/TestSetup';
import { Test } from '../../backk/decorators/service/function/Test';
import { PostTests } from '../../backk/decorators/service/function/PostTests';
import getThumbnailImageDataUri from '../common/utils/getThumbnailImageDataUri';
import sendToRemoteService from '../../backk/remote/messagequeue/sendToRemoteService';
import { Update } from "../../backk/decorators/service/function/Update";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class SalesItemServiceImpl extends SalesItemService {
  private static readonly DEFAULT_SALES_ITEM_FIELDS = [
    '_id',
    'title',
    'price',
    'previousPrice',
    'primaryImageDataUri'
  ];

  constructor(dbManager: AbstractDbManager) {
    super(salesItemServiceErrors, dbManager);
  }

  @AllowForTests()
  deleteAllSalesItems(): PromiseOfErrorOr<null> {
    return this.dbManager.deleteAllEntities(SalesItem);
  }

  @AllowForSelf()
  @NoCaptcha()
  createSalesItem(arg: SalesItem): PromiseOfErrorOr<SalesItem> {
    return this.dbManager.createEntity(
      {
        ...arg,
        state: 'forSale',
        previousPrice: null,
        primaryImageThumbnailDataUri: getThumbnailImageDataUri(arg.primaryImageDataUri)
      },
      SalesItem,
      {
        preHooks: {
          isSuccessfulOrTrue: async () => {
            const [usersSellableSalesItemCount, error] = await this.dbManager.getEntitiesCount(
              { userAccountId: arg.userAccountId, state: 'forSale' },
              SalesItem
            );

            return typeof usersSellableSalesItemCount === 'number'
              ? usersSellableSalesItemCount < 100
              : error;
          },
          error: salesItemServiceErrors.maximumSalesItemCountPerUserExceeded
        }
      }
    );
  }

  @AllowForEveryUser()
  getSalesItems({
    textFilter,
    areas,
    productDepartments,
    productCategories,
    productSubCategories,
    minPrice,
    maxPrice,
    ...sortingAndPagination
  }: GetSalesItemsArg): PromiseOfErrorOr<SalesItem[]> {
    const filters = this.dbManager.getFilters<SalesItem>(
      {
        state: 'forSale' as SalesItemState,
        ...(textFilter
          ? { $or: [{ title: new RegExp(textFilter) }, { description: new RegExp(textFilter) }] }
          : {}),
        ...(areas ? { area: { $in: areas } } : {}),
        ...(productDepartments ? { productDepartment: { $in: productDepartments } } : {}),
        ...(productCategories ? { productCategory: { $in: productCategories } } : {}),
        ...(productSubCategories ? { productSubCategory: { $in: productSubCategories } } : {}),
        ...(minPrice !== undefined || maxPrice
          ? {
              $and: [
                { price: { $gte: minPrice || 0 } },
                { price: { $lte: maxPrice || Number.MAX_SAFE_INTEGER } }
              ]
            }
          : {})
      },
      [
        new SqlEquals({ state: 'forSale' }),
        new SqlExpression('title LIKE :textFilter OR description LIKE :textFilter', {
          textFilter: textFilter ? `%${textFilter}%` : undefined
        }),
        new SqlInExpression('area', areas),
        new SqlInExpression('productDepartment', productDepartments),
        new SqlInExpression('productCategory', productCategories),
        new SqlInExpression('productSubCategory', productSubCategories),
        new SqlExpression('price >= :minPrice', { minPrice }),
        new SqlExpression('price <= :maxPrice', { maxPrice })
      ]
    );

    return this.dbManager.getEntitiesByFilters(filters, SalesItem, {
      ...sortingAndPagination,
      includeResponseFields: SalesItemServiceImpl.DEFAULT_SALES_ITEM_FIELDS
    });
  }

  @AllowForEveryUser()
  getSalesItemsByUserDefinedFilters({
    filters
  }: GetSalesItemsByUserDefinedFiltersArg): PromiseOfErrorOr<SalesItem[]> {
    return this.dbManager.getEntitiesByFilters(filters, SalesItem, new DefaultPostQueryOperations());
  }

  @AllowForSelf()
  async getFollowedUsersSalesItems({
    userAccountId
  }: UserAccountId): PromiseOfErrorOr<FollowedUserSalesItem[]> {
    const [user, error] = await this.dbManager.getEntityByFilters(
      { _id: userAccountId, 'followedUserAccounts.ownSalesItems.state': 'forSale' },
      User,
      {
        sortBys: [
          {
            subEntityPath: 'followedUserAccounts.ownSalesItems',
            fieldName: 'lastModifiedTimestamp',
            sortDirection: 'DESC'
          }
        ],
        includeResponseFields: [
          'followedUserAccounts._id',
          'followedUserAccounts.displayName',
          ...SalesItemServiceImpl.DEFAULT_SALES_ITEM_FIELDS.map(
            (defaultSalesItemField) => `followedUserAccounts.ownSalesItems.${defaultSalesItemField}`
          )
        ]
      }
    );

    const followedUserSalesItems = user?.followedUserAccounts
      .map((followedUserAccount) =>
        followedUserAccount.ownSalesItems.map((ownSalesItem) => ({
          ...ownSalesItem,
          userAccountId: followedUserAccount._id,
          displayName: followedUserAccount.displayName
        }))
      )
      .flat();

    return [followedUserSalesItems, error];
  }

  @AllowForEveryUser()
  async getSalesItem({ _id }: _Id): PromiseOfErrorOr<SalesItem> {
    return this.dbManager.getEntityById(_id, SalesItem);
  }

  @AllowForSelf()
  @Update('addOrRemove')
  followSalesItemPriceChange({ _id, userAccountId }: _IdAndUserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.addFieldValues(_id, 'priceChangeFollowingUserAccountIds', [userAccountId], SalesItem);
  }

  @AllowForSelf()
  @Update('addOrRemove')
  unfollowSalesItemPriceChange({ _id, userAccountId }: _IdAndUserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.removeFieldValues(_id, 'priceChangeFollowingUserAccountIds', [userAccountId], SalesItem);
  }

  @AllowForSelf()
  async updateSalesItem(salesItem: SalesItem): PromiseOfErrorOr<null> {
    let isPriceUpdated: boolean;

    return this.dbManager.updateEntity(salesItem, SalesItem, {
      preHooks: [
        {
          isSuccessfulOrTrue: ({ state }) => state === 'forSale',
          error: salesItemServiceErrors.salesItemStateIsNotForSale
        },
        ({ _id, price }) => {
          if (salesItem.price !== price) {
            isPriceUpdated = true;
            return this.dbManager.updateEntity({ _id, previousPrice: price }, SalesItem);
          }
          return true;
        }
      ],
      postHook: {
        shouldExecutePostHook: () => isPriceUpdated,
        isSuccessfulOrTrue: () =>
          sendToRemoteService(
            `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendPriceChangeNotifications`,
            {
              salesItemId: salesItem._id,
              salesItemTitle: salesItem.title,
              salesItemNewPrice: salesItem.price,
              userAccountIdsToNotify: salesItem.priceChangeFollowingUserAccountIds
            }
          )
      }
    });
  }

  @AllowForServiceInternalUse()
  updateSalesItemStates(
    salesItems: ShoppingCartOrOrderSalesItem[],
    newState: SalesItemState,
    requiredCurrentStates?: SalesItemState[],
    buyerUserAccountId?: string
  ): PromiseOfErrorOr<null> {
    return executeForAll(salesItems, ({ _id }) =>
      this.updateSalesItemState(_id, newState, requiredCurrentStates, buyerUserAccountId)
    );
  }

  @AllowForServiceInternalUse()
  updateSalesItemState(
    _id: string,
    newState: SalesItemState,
    requiredCurrentStates?: SalesItemState[],
    buyerUserAccountId?: string
  ): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, state: newState, buyerUserAccountId: newState === 'forSale' ? null : buyerUserAccountId },
      SalesItem,
      {
        preHooks: [
          {
            shouldExecutePreHook: () => !!requiredCurrentStates,
            isSuccessfulOrTrue: ({ state }) => (requiredCurrentStates ?? []).includes(state),
            error: salesItemServiceErrors.invalidSalesItemState
          },
          {
            shouldExecutePreHook: () => newState === 'sold',
            isSuccessfulOrTrue: ({ buyerUserAccountId }) => buyerUserAccountId === buyerUserAccountId,
            error: salesItemServiceErrors.invalidSalesItemState
          }
        ]
      }
    );
  }

  @TestSetup([
    {
      setupStepName: 'add sales item to shopping cart',
      serviceFunctionName: 'shoppingCartService.addToShoppingCart'
    }
  ])
  @PostTests([
    {
      testName: 'sales item is for sale',
      serviceFunctionName: 'salesItemService.getSalesItem',
      expectedResult: { state: 'forSale' }
    }
  ])
  @CronJob({ minuteInterval: 1 })
  changeExpiredReservedSalesItemStatesToForSale({
    maxSalesItemReservationDurationInMinutes
  }: ChangeExpiredReservedSalesItemStatesToForSaleArg): PromiseOfErrorOr<null> {
    const filters = this.dbManager.getFilters(
      {
        state: 'reserved',
        lastModifiedTimestamp: {
          $lte: dayjs()
            .subtract(maxSalesItemReservationDurationInMinutes, 'minutes')
            .toDate()
        }
      },
      [
        new SqlEquals({ state: 'reserved' }),
        new SqlExpression(
          `lastmodifiedtimestamp <= current_timestamp - INTERVAL '${maxSalesItemReservationDurationInMinutes}' minute`
        )
      ]
    );

    return this.dbManager.updateEntitiesByFilters<SalesItem>(
      filters,
      { state: 'forSale', buyerUserAccountId: null },
      SalesItem
    );
  }

  @CronJob({ minutes: 0, hours: 2 })
  deleteOldUnsoldSalesItemsDaily({
    deletableUnsoldSalesItemMinAgeInMonths
  }: DeleteOldUnsoldSalesItemsArg): PromiseOfErrorOr<null> {
    const filters = this.dbManager.getFilters(
      {
        state: 'forSale',
        createdAtTimestamp: {
          $lte: dayjs()
            .subtract(deletableUnsoldSalesItemMinAgeInMonths, 'months')
            .toDate()
        }
      },
      [
        new SqlEquals({ state: 'forSale' }),
        new SqlExpression(
          `createdattimestamp <= current_timestamp - INTERVAL '${deletableUnsoldSalesItemMinAgeInMonths}' month`
        )
      ]
    );

    return this.dbManager.deleteEntitiesByFilters(filters, SalesItem);
  }

  @AllowForSelf()
  deleteSalesItem({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, SalesItem);
  }
}
