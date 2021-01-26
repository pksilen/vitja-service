import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import MongoDbManager from '../../backk/dbmanager/MongoDbManager';
import SqlEquals from '../../backk/dbmanager/sql/expressions/SqlEquals';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import SqlInExpression from '../../backk/dbmanager/sql/expressions/SqlInExpression';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import SalesItemsService from './SalesItemsService';
import GetSalesItemsArg from './types/args/GetSalesItemsArg';
import UpdateSalesItemStateArg from './types/args/UpdateSalesItemStateArg';
import { SalesItem } from './types/entities/SalesItem';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import _IdsAndDefaultPostQueryOperations from '../../backk/types/postqueryoperations/_IdsAndDefaultPostQueryOperations';
import _IdAndUserId from '../../backk/types/id/_IdAndUserId';
import _Id from '../../backk/types/id/_Id';
import {
  INVALID_SALES_ITEM_STATE,
  MAXIMUM_SALES_ITEM_COUNT_EXCEEDED,
  SALES_ITEM_STATE_MUST_BE_FOR_SALE
} from './errors/salesItemsServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { SalesItemState } from './types/enums/SalesItemState';
import GetSalesItemsByUserDefinedFiltersArg from './types/args/GetSalesItemsByUserDefinedFiltersArg';
import DefaultPostQueryOperations from '../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import MongoDbQuery from '../../backk/dbmanager/mongodb/MongoDbQuery';

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
        expectTrueOrSuccess: async () => {
          const usersActiveSalesItemCountOrErrorResponse = await this.dbManager.getEntitiesCount(
            { userId: arg.userId, state: 'forSale' },
            SalesItem
          );
          return typeof usersActiveSalesItemCountOrErrorResponse === 'number'
            ? usersActiveSalesItemCountOrErrorResponse <= 100
            : usersActiveSalesItemCountOrErrorResponse;
        },
        error: MAXIMUM_SALES_ITEM_COUNT_EXCEEDED
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
    ...postQueryOps
  }: GetSalesItemsArg): Promise<SalesItem[] | ErrorResponse> {
    let filters;

    if (this.dbManager instanceof MongoDbManager) {
      filters = [
        new MongoDbQuery<SalesItem>({
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
        })
      ];
    } else {
      filters = [
        new SqlEquals({ state: 'forSale' }),
        new SqlExpression('title LIKE :textFilter OR description LIKE :textFilter', {
          textFilter
        }),
        new SqlInExpression('area', areas),
        new SqlInExpression('productDepartment', productDepartments),
        new SqlInExpression('productCategory', productCategories),
        new SqlInExpression('productSubCategory', productSubCategories),
        new SqlExpression('price >= :minPrice', { minPrice }),
        new SqlExpression('price <= :maxPrice', { maxPrice })
      ];
    }

    return this.dbManager.getEntitiesByFilters(filters, SalesItem, postQueryOps);
  }

  @AllowForEveryUser()
  getSalesItemsByUserDefinedFilters({
    filters
  }: GetSalesItemsByUserDefinedFiltersArg): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getEntitiesByFilters(filters, SalesItem, new DefaultPostQueryOperations());
  }

  @AllowForSelf()
  getSalesItemsByUserId({
    userId,
    ...postQueryOperations
  }: GetByUserIdArg): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getEntitiesWhere('userId', userId, SalesItem, postQueryOperations);
  }

  @AllowForEveryUser()
  getSalesItemsForSaleByIds({
    _ids,
    ...postQueryOperations
  }: _IdsAndDefaultPostQueryOperations): Promise<SalesItem[] | ErrorResponse> {
    const filters =
      this.dbManager instanceof MongoDbManager
        ? [new MongoDbQuery<SalesItem>({ state: 'forSale' as SalesItemState, _id: { $in: _ids } })]
        : [new SqlEquals({ state: 'forSale' }), new SqlInExpression('_id', _ids)];

    return this.dbManager.getEntitiesByFilters(filters, SalesItem, postQueryOperations);
  }

  @AllowForEveryUser()
  getSalesItemById({ _id }: _Id): Promise<SalesItem | ErrorResponse> {
    return this.dbManager.getEntityById(_id, SalesItem);
  }

  @AllowForSelf()
  @Errors([SALES_ITEM_STATE_MUST_BE_FOR_SALE])
  async updateSalesItem(arg: SalesItem): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(arg, SalesItem, [], {
      expectTrueOrSuccess: async ([{ _id, state, price }]) =>
        (await this.dbManager.updateEntity({ _id, previousPrice: price }, SalesItem, [])) ||
        state === 'forSale',
      error: SALES_ITEM_STATE_MUST_BE_FOR_SALE
    });
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
      [],
      requiredCurrentState
        ? {
            expectTrueOrSuccess: ([{ state }]) => state === requiredCurrentState,
            error: INVALID_SALES_ITEM_STATE
          }
        : undefined
    );
  }

  @AllowForSelf()
  deleteSalesItemById({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, SalesItem);
  }
}
