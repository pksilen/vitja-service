import { Injectable } from "@nestjs/common";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForEveryUser } from "../../backk/decorators/service/function/AllowForEveryUser";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import { NoCaptcha } from "../../backk/decorators/service/function/NoCaptcha";
import { AllowForServiceInternalUse } from "../../backk/decorators/service/function/AllowForServiceInternalUse";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import SqlEquals from "../../backk/dbmanager/sql/expressions/SqlEquals";
import SqlExpression from "../../backk/dbmanager/sql/expressions/SqlExpression";
import SqlInExpression from "../../backk/dbmanager/sql/expressions/SqlInExpression";
import SalesItemsService from "./SalesItemsService";
import GetSalesItemsArg from "./types/args/GetSalesItemsArg";
import UpdateSalesItemStateArg from "./types/args/UpdateSalesItemStateArg";
import { SalesItem } from "./types/entities/SalesItem";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _IdAndUserId from "../../backk/types/id/_IdAndUserId";
import _Id from "../../backk/types/id/_Id";
import {
  INVALID_SALES_ITEM_STATE,
  MAXIMUM_SALES_ITEM_COUNT_EXCEEDED,
  SALES_ITEM_STATE_MUST_BE_FOR_SALE
} from "./errors/salesItemsServiceErrors";
import { Errors } from "../../backk/decorators/service/function/Errors";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { SalesItemState } from "./types/enums/SalesItemState";
import GetSalesItemsByUserDefinedFiltersArg from "./types/args/GetSalesItemsByUserDefinedFiltersArg";
import DefaultPostQueryOperations from "../../backk/types/postqueryoperations/DefaultPostQueryOperations";
import awaitOperationAndGetResultOfPredicate from "../../backk/utils/getErrorResponseOrResultOf";
import { CronJob } from "../../backk/decorators/service/function/CronJob";
import DeleteOldUnsoldSalesItemsArg from "./types/args/DeleteOldUnsoldSalesItemsArg";
import dayjs from "dayjs";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class SalesItemsServiceImpl extends SalesItemsService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForTests()
  deleteAllSalesItems(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(SalesItem);
  }

  @NoCaptcha()
  @AllowForSelf()
  @Errors([MAXIMUM_SALES_ITEM_COUNT_EXCEEDED])
  async createSalesItem(arg: SalesItem): Promise<SalesItem | ErrorResponse> {
    return this.dbManager.createEntity(
      {
        ...arg,
        state: 'forSale',
        previousPrice: -1
      },
      SalesItem,
      {
        isSuccessfulOrTrue: () =>
          awaitOperationAndGetResultOfPredicate(
            this.dbManager.getEntitiesCount({ userId: arg.userId, state: 'forSale' }, SalesItem),
            (usersSellableSalesItemCount) => usersSellableSalesItemCount <= 100
          ),
        errorMessage: MAXIMUM_SALES_ITEM_COUNT_EXCEEDED
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
    ...postQueryOperations
  }: GetSalesItemsArg): Promise<SalesItem[] | ErrorResponse> {
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
          textFilter: `%${textFilter}%`
        }),
        new SqlInExpression('area', areas),
        new SqlInExpression('productDepartment', productDepartments),
        new SqlInExpression('productCategory', productCategories),
        new SqlInExpression('productSubCategory', productSubCategories),
        new SqlExpression('price >= :minPrice', { minPrice }),
        new SqlExpression('price <= :maxPrice', { maxPrice })
      ]
    );

    return this.dbManager.getEntitiesByFilters(filters, SalesItem, postQueryOperations);
  }

  @AllowForEveryUser()
  getSalesItemsByUserDefinedFilters({
    filters
  }: GetSalesItemsByUserDefinedFiltersArg): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getEntitiesByFilters(filters, SalesItem, new DefaultPostQueryOperations());
  }

  @AllowForEveryUser()
  getSalesItem({ _id }: _Id): Promise<SalesItem | ErrorResponse> {
    return this.dbManager.getEntityById(_id, SalesItem);
  }

  @AllowForSelf()
  @Errors([SALES_ITEM_STATE_MUST_BE_FOR_SALE])
  async updateSalesItem(arg: SalesItem): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(arg, SalesItem, [
      {
        isSuccessfulOrTrue: ({ state }) => state === 'forSale',
        errorMessage: SALES_ITEM_STATE_MUST_BE_FOR_SALE
      },
      ({ _id, price }) => this.dbManager.updateEntity({ _id, previousPrice: price }, SalesItem, [])
    ]);
  }

  @AllowForServiceInternalUse()
  @Errors([INVALID_SALES_ITEM_STATE])
  updateSalesItemState(
    { _id, newState }: UpdateSalesItemStateArg,
    requiredCurrentState?: SalesItemState
  ): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      { _id, state: newState },
      SalesItem,
      requiredCurrentState
        ? {
            isSuccessfulOrTrue: ({ state }) => state === requiredCurrentState,
            errorMessage: INVALID_SALES_ITEM_STATE
          }
        : undefined
    );
  }

  @CronJob({ minutes: 0, hours: 2 })
  deleteOldUnsoldSalesItems({
    deletableUnsoldSalesItemMinAgeInMonths
  }: DeleteOldUnsoldSalesItemsArg): Promise<void | ErrorResponse> {
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
  deleteSalesItem({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, SalesItem);
  }
}
