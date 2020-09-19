import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdsAndPaging, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import { SalesItem } from './types/SalesItem';
import SalesItemWithoutIdAndCreatedTimestampAndState from './types/SalesItemWithoutIdAndCreatedTimestampAndState';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import SalesItemsService from './SalesItemsService';
import MongoDbManager from '../../backk/dbmanager/MongoDbManager';
import SqlInExpression from '../../backk/sqlexpression/SqlInExpression';
import SqlExpression from '../../backk/sqlexpression/SqlExpression';
import SalesItemWithoutCreatedTimestampAndState from './types/SalesItemWithoutCreatedTimestampAndState';
import SalesItemIdAndState from './types/SalesItemIdAndState';

@Injectable()
export default class SalesItemsServiceImpl extends SalesItemsService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  deleteAllSalesItems(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(SalesItem);
  }

  createSalesItem(
    salesItemWithoutIdAndCreatedTimestampAndState: SalesItemWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse> {
    return this.dbManager.createItem(
      {
        ...salesItemWithoutIdAndCreatedTimestampAndState,
        createdTimestampInSecs: Math.round(Date.now() / 1000),
        state: 'forSale'
      },
      SalesItem,
      this.Types
    );
  }

  getSalesItems({
    textFilter,
    areas,
    productDepartments,
    productCategories,
    productSubCategories,
    minPrice,
    maxPrice,
    ...postQueryOperations
  }: SalesItemsFilters): Promise<Array<Partial<SalesItem>> | ErrorResponse> {
    let filters;

    if (this.dbManager instanceof MongoDbManager) {
      filters = {
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
        new SqlExpression('title LIKE :textFilter OR description LIKE :textFilter', { textFilter }),
        new SqlInExpression('area', areas),
        new SqlInExpression('productDepartment', productDepartments),
        new SqlInExpression('productCategory', productCategories),
        new SqlInExpression('productSubCategory', productSubCategories),
        new SqlExpression('price >= :minPrice', { minPrice }),
        new SqlExpression('price <= :maxPrice', { maxPrice })
      ];
    }

    return this.dbManager.getItems(filters, postQueryOperations, SalesItem, this.Types);
  }

  getSalesItemsByUserId({ userId }: UserIdAndPaging): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getItemsBy<SalesItem>('userId', userId, SalesItem, this.Types);
  }

  getSalesItemsByIds({ _ids }: IdsAndPaging): Promise<SalesItem[] | ErrorResponse> {
    return this.dbManager.getItemsByIds(_ids, SalesItem, this.Types);
  }

  getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return this.dbManager.getItemById(_id, SalesItem, this.Types);
  }

  updateSalesItem(
    salesItemWithoutCreatedTimestampAndState: SalesItemWithoutCreatedTimestampAndState
  ): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(salesItemWithoutCreatedTimestampAndState, SalesItem, this.Types);
  }

  updateSalesItemState(
    salesItemIdAndState: SalesItemIdAndState,
    requiredCurrentState: undefined | 'forSale' | 'sold' = undefined
  ): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(
      salesItemIdAndState,
      SalesItem,
      this.Types,
      requiredCurrentState
        ? {
            state: requiredCurrentState
          }
        : undefined
    );
  }

  deleteSalesItemById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, SalesItem);
  }
}
