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
import { CronJob } from '../../backk/decorators/service/function/CronJob';
import DeleteOldUnsoldSalesItemsArg from './types/args/DeleteOldUnsoldSalesItemsArg';
import dayjs from 'dayjs';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import User from '../user/types/entities/User';
import FollowedUserSalesItem from './types/responses/FollowedUserSalesItem';
import ShoppingCartOrOrderSalesItem from '../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem';
import executeForAll from '../../backk/utils/executeForAll';
import ChangeExpiredReservedSalesItemStatesToForSaleArg from './types/args/ChangeExpiredReservedSalesItemStatesToForSaleArg';
import { salesItemServiceErrors } from './errors/salesItemServiceErrors';
import getThumbnailImageDataUri from '../common/utils/getThumbnailImageDataUri';
import sendToRemoteService from '../../backk/remote/messagequeue/sendToRemoteService';
import { Update } from '../../backk/decorators/service/function/Update';
import MongoDbQuery from '../../backk/dbmanager/mongodb/MongoDbQuery';

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
  deleteAllSalesItems(): PromiseErrorOr<null> {
    return this.dbManager.deleteAllEntities(SalesItem);
  }

  @AllowForSelf()
  @NoCaptcha()
  createSalesItem(arg: SalesItem): PromiseErrorOr<SalesItem> {
    return this.dbManager.createEntity(
      SalesItem,
      {
        ...arg,
        state: 'forSale',
        previousPrice: null,
        primaryImageThumbnailDataUri: getThumbnailImageDataUri(arg.primaryImageDataUri),
        likeCount: 0
      },
      {
        preHooks: {
          shouldSucceedOrBeTrue: async () => {
            const [usersSellableSalesItemCount, error] = await this.dbManager.getEntityCount(SalesItem, {
              userAccountId: arg.userAccountId,
              state: 'forSale'
            });

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
  }: GetSalesItemsArg): PromiseErrorOr<SalesItem[]> {
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

    return this.dbManager.getEntitiesByFilters(SalesItem, filters, {
      postQueryOperations: {
        ...sortingAndPagination,
        includeResponseFields: SalesItemServiceImpl.DEFAULT_SALES_ITEM_FIELDS
      }
    });
  }

  @AllowForEveryUser()
  getSalesItemsByUserDefinedFilters({
    filters
  }: GetSalesItemsByUserDefinedFiltersArg): PromiseErrorOr<SalesItem[]> {
    return this.dbManager.getEntitiesByFilters(SalesItem, filters);
  }

  @AllowForSelf()
  async getFollowedUsersSalesItems({
    userAccountId
  }: UserAccountId): PromiseErrorOr<FollowedUserSalesItem[]> {
    const [user, error] = await this.dbManager.getEntityByFilters(
      User,
      {
        _id: userAccountId,
        'followedUserAccounts.ownSalesItems.state': 'forSale'
      },
      {
        postQueryOperations: {
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
  getSalesItem({ _id }: _Id): PromiseErrorOr<SalesItem> {
    return this.dbManager.getEntityById(SalesItem, _id);
  }

  @AllowForSelf()
  @Update('addOrRemove')
  followSalesItemPriceChange({ _id, userAccountId }: _IdAndUserAccountId): PromiseErrorOr<null> {
    return this.dbManager.addEntityArrayFieldValues(SalesItem, _id, 'priceChangeFollowingUserAccountIds', [
      userAccountId
    ]);
  }

  @AllowForSelf()
  @Update('addOrRemove')
  unfollowSalesItemPriceChange({ _id, userAccountId }: _IdAndUserAccountId): PromiseErrorOr<null> {
    return this.dbManager.removeEntityArrayFieldValues(SalesItem, _id, 'priceChangeFollowingUserAccountIds', [
      userAccountId
    ]);
  }

  @AllowForSelf()
  @Update('addOrRemove')
  toggleLikeSalesItem({ _id, userAccountId }: _IdAndUserAccountId): PromiseErrorOr<null> {
    return this.dbManager.executeInsideTransaction(async () => {
      const [isLiked, error] = await this.dbManager.doesEntityArrayFieldContainValue(
        SalesItem,
        _id,
        'likedUserAccountIds',
        userAccountId
      );

      if (isLiked === true) {
        return this.dbManager.removeEntityArrayFieldValues(
          SalesItem,
          _id,
          'likedUserAccountIds',
          [userAccountId],
          {
            entityPreHooks: ({ likeCount, version }) =>
              this.dbManager.updateEntity(SalesItem, { _id, version, likeCount: likeCount - 1 })
          }
        );
      } else if (isLiked === false) {
        return this.dbManager.addEntityArrayFieldValues(
          SalesItem,
          _id,
          'likedUserAccountIds',
          [userAccountId],
          {
            entityPreHooks: ({ likeCount, version }) =>
              this.dbManager.updateEntity(SalesItem, { _id, version, likeCount: likeCount + 1 })
          }
        );
      }

      return [null, error];
    });
  }

  @AllowForSelf()
  updateSalesItem(salesItem: SalesItem): PromiseErrorOr<null> {
    let isPriceUpdated: boolean;

    return this.dbManager.updateEntity(SalesItem, salesItem, {
      entityPreHooks: [
        {
          shouldSucceedOrBeTrue: ({ state }) => state === 'forSale',
          error: salesItemServiceErrors.salesItemStateIsNotForSale
        },
        ({ _id, price }) => {
          if (salesItem.price !== price) {
            isPriceUpdated = true;
            return this.dbManager.updateEntity(SalesItem, { _id, previousPrice: price });
          }
          return true;
        }
      ],
      postHook: {
        executePostHookIf: () => isPriceUpdated,
        shouldSucceedOrBeTrue: () =>
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

  @CronJob({ minuteInterval: 1 })
  changeExpiredReservedSalesItemStatesToForSale({
    maxSalesItemReservationDurationInMinutes
  }: ChangeExpiredReservedSalesItemStatesToForSaleArg): PromiseErrorOr<null> {
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

    return this.dbManager.updateEntitiesByFilters<SalesItem>(SalesItem, filters, {
      state: 'forSale',
      buyerUserAccountId: null
    });
  }

  @CronJob({ minutes: 0, hours: 2 })
  deleteOldUnsoldSalesItemsDaily({
    deletableUnsoldSalesItemMinAgeInMonths
  }: DeleteOldUnsoldSalesItemsArg): PromiseErrorOr<null> {
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

    return this.dbManager.deleteEntitiesByFilters(SalesItem, filters);
  }

  @AllowForSelf()
  deleteSalesItem({ _id }: _IdAndUserAccountId): PromiseErrorOr<null> {
    return this.dbManager.deleteEntityById(SalesItem, _id);
  }

  @AllowForServiceInternalUse()
  updateSalesItemStates(
    salesItems: ShoppingCartOrOrderSalesItem[],
    newState: SalesItemState,
    requiredCurrentState?: SalesItemState,
    buyerUserAccountId?: string
  ): PromiseErrorOr<null> {
    return executeForAll(salesItems, ({ _id }) =>
      this.updateSalesItemState(_id, newState, requiredCurrentState, buyerUserAccountId)
    );
  }

  @AllowForServiceInternalUse()
  updateSalesItemState(
    _id: string,
    newState: SalesItemState,
    requiredCurrentState?: SalesItemState,
    buyerUserAccountId?: string
  ): PromiseErrorOr<null> {
    return this.dbManager.updateEntity(
      SalesItem,
      {
        _id,
        state: newState,
        buyerUserAccountId: newState === 'forSale' ? null : buyerUserAccountId
      },
      {
        entityPreHooks: [
          {
            executePreHookIf: () => !!requiredCurrentState,
            shouldSucceedOrBeTrue: ({ state }) => requiredCurrentState === state,
            error: salesItemServiceErrors.invalidSalesItemState
          },
          {
            executePreHookIf: () => newState === 'sold',
            shouldSucceedOrBeTrue: ({ buyerUserAccountId }) => buyerUserAccountId === buyerUserAccountId,
            error: salesItemServiceErrors.invalidSalesItemState
          }
        ]
      }
    );
  }

  @AllowForServiceInternalUse()
  updateSalesItemStatesByFilters(
    salesItemIds: string[],
    newState: SalesItemState,
    currentStateFilter: SalesItemState,
    buyerUserAccountIdFilter: string
  ): PromiseErrorOr<null> {
    const finalFilters = this.dbManager.getFilters(
      [
        new MongoDbQuery({
          _id: { $in: salesItemIds },
          state: currentStateFilter,
          buyerUserAccountId: buyerUserAccountIdFilter
        })
      ],
      [
        new SqlInExpression('_id', salesItemIds),
        new SqlEquals({ state: currentStateFilter, buyerUserAccountId: buyerUserAccountIdFilter })
      ]
    );

    return this.dbManager.updateEntitiesByFilters<SalesItem>(SalesItem, finalFilters, { state: newState });
  }
}
