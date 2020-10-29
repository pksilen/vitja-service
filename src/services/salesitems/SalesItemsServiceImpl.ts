import { Injectable, Optional } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { Private } from '../../backk/decorators/service/function/Private';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import MongoDbManager from '../../backk/dbmanager/MongoDbManager';
import SqlEquals from '../../backk/dbmanager/sql/expressions/SqlEquals';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import SqlInExpression from '../../backk/dbmanager/sql/expressions/SqlInExpression';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import SalesItemsService from './SalesItemsService';
import CreateSalesItemArg from './types/args/CreateSalesItemArg';
import GetSalesItemsArg from './types/args/GetSalesItemsArg';
import UpdateSalesItemArg from './types/args/UpdateSalesItemArg';
import UpdateSalesItemStateArg from './types/args/UpdateSalesItemStateArg';
import { SalesItem } from './types/entities/SalesItem';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import IdsAndDefaultPostQueryOperationsArg from '../../backk/types/postqueryoperations/args/IdsAndDefaultPostQueryOperationsArg';
import IdAndUserId from '../../backk/types/id/IdAndUserId';
import _Id from '../../backk/types/id/_Id';
import getErrorResponseOrResultOf from '../../backk/utils/getErrorResponseOrResultOf';
import SortBy from '../../backk/types/postqueryoperations/SortBy';
import {
  INVALID_SALES_ITEM_STATE,
  MAXIMUM_SALES_ITEM_COUNT_EXCEEDED,
  SALES_ITEM_STATE_MUST_BE_FOR_SALE
} from './errors/salesItemsServiceErrors';
import { Errors } from "../../backk/decorators/service/function/Errors";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class SalesItemsServiceImpl extends SalesItemsService {
  constructor(
    dbManager: AbstractDbManager,
    @Optional()
    readonly Types = {
      GetByUserIdArg,
      GetSalesItemsArg,
      CreateSalesItemArg,
      UpdateSalesItemArg,
      UpdateSalesItemStateArg,
      SalesItem,
      SortBy
    }
  ) {
    super(dbManager, Types);
  }

  deleteAllSalesItems(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(SalesItem);
  }

  @NoCaptcha()
  @AllowForSelf()
  @Errors([MAXIMUM_SALES_ITEM_COUNT_EXCEEDED])
  async createSalesItem(arg: CreateSalesItemArg): Promise<SalesItem | ErrorResponse> {
    return this.dbManager.createEntity(
      {
        ...arg,
        createdTimestampInSecs: Math.round(Date.now() / 1000),
        state: 'forSale',
        previousPrice: -1
      },
      SalesItem,
      {
        hookFunc: async () =>
          getErrorResponseOrResultOf(
            await this.dbManager.getEntitiesCount({ userId: arg.userId, state: 'forSale' }, SalesItem),
            (activeSalesItemCount) => activeSalesItemCount <= 100
          ),
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
      filters = {
        state: 'forSale' as 'forSale',
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
      };
    } else {
      filters = [
        new SqlEquals({ state: 'forSale' }),
        new SqlExpression('{{title}} LIKE :textFilter OR {{description}} LIKE :textFilter', {
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

    return this.dbManager.getEntities(filters, SalesItem, postQueryOps);
  }

  @AllowForSelf()
  getSalesItemsByUserId({
    userId,
    _postQueryOperations
  }: GetByUserIdArg): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getEntitiesBy('userId', userId, SalesItem, _postQueryOperations);
  }

  @AllowForEveryUser()
  getSalesItemsByIds({
    _ids,
    _postQueryOperations
  }: IdsAndDefaultPostQueryOperationsArg): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getEntitiesByIds(_ids, SalesItem, _postQueryOperations);
  }

  @AllowForEveryUser()
  getSalesItemById({ _id }: _Id): Promise<SalesItem | ErrorResponse> {
    return this.dbManager.getEntityById(_id, SalesItem);
  }

  @AllowForSelf()
  @Errors([SALES_ITEM_STATE_MUST_BE_FOR_SALE])
  async updateSalesItem(arg: UpdateSalesItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      const currentSalesItemOrErrorResponse = await this.getSalesItemById({ _id: arg._id });

      return 'errorMessage' in currentSalesItemOrErrorResponse
        ? currentSalesItemOrErrorResponse
        : this.dbManager.updateEntity(
            { ...arg, previousPrice: currentSalesItemOrErrorResponse.price },
            SalesItem,
            {
              entityJsonPath: 'state',
              hookFunc: (state) => state === 'forSale',
              error: SALES_ITEM_STATE_MUST_BE_FOR_SALE
            }
          );
    });
  }

  @Private()
  @Errors([INVALID_SALES_ITEM_STATE])
  updateSalesItemState(
    arg: UpdateSalesItemStateArg,
    requiredCurrentState?: 'forSale' | 'sold'
  ): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      arg,
      SalesItem,
      requiredCurrentState
        ? {
            entityJsonPath: 'state',
            hookFunc: (state) => state === requiredCurrentState,
            error: INVALID_SALES_ITEM_STATE
          }
        : undefined
    );
  }

  @AllowForSelf()
  deleteSalesItemById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, SalesItem);
  }
}
