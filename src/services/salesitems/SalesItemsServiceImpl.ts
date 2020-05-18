import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import { SalesItem } from './types/SalesItem';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import SalesItemsService from './SalesItemsService';
import MongoDbManager from '../../backk/dbmanager/MongoDbManager';
import SqlInExpression from '../../backk/sqlexpression/SqlInExpression';

@Injectable()
export default class SalesItemsServiceImpl extends SalesItemsService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  async deleteAllSalesItems(): Promise<void | ErrorResponse> {
    return await this.dbManager.deleteAllItems(SalesItem);
  }

  async createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await this.dbManager.createItem(
      { ...salesItemWithoutId, createdTimestampInMillis: Date.now() },
      SalesItem,
      this.Types
    );
  }

  async getSalesItems({
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
      filters = {
        textFilter: ['title LIKE :textFilter OR description LIKE :textFilter', { textFilter }],
        areas: new SqlInExpression(areas),
        productDepartments: new SqlInExpression(productDepartments),
        productCategories: new SqlInExpression(productCategories),
        productSubCategories: new SqlInExpression(productSubCategories),
        priceRange: [
          'price >= :minPrice AND price <= :maxPrice',
          { minPrice: minPrice || 0, maxPrice: maxPrice || Number.MAX_SAFE_INTEGER }
        ]
      };
    }

    return await this.dbManager.getItems(filters, postQueryOperations, SalesItem, this.Types);
  }

  async getSalesItemsByUserId({ userId }: UserIdWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await this.dbManager.getItemsBy<SalesItem>('userId', userId, SalesItem, this.Types);
  }

  async getSalesItemsByIds({ _ids }: IdsWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await this.dbManager.getItemsByIds(_ids, SalesItem);
  }

  async getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await this.dbManager.getItemById(_id, SalesItem);
  }

  async updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse> {
    await this.dbManager.updateItem(salesItem, SalesItem, this.Types);
  }

  async deleteSalesItemById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await this.dbManager.deleteItemById(_id, SalesItem);
  }
}
