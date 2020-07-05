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
import SqlExpression from '../../backk/sqlexpression/SqlExpression';

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
      { ...salesItemWithoutId, createdTimestampInSecs: Math.round(Date.now() / 1000) },
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
    const schema = this.dbManager.schema;

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

    return await this.dbManager.getItems(filters, postQueryOperations, SalesItem, this.Types);
  }

  async getSalesItemsByUserId({ userId }: UserIdWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await this.dbManager.getItemsBy<SalesItem>('userId', userId, SalesItem, this.Types);
  }

  async getSalesItemsByIds({ _ids }: IdsWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await this.dbManager.getItemsByIds(_ids, SalesItem, this.Types);
  }

  async getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await this.dbManager.getItemById(_id, SalesItem, this.Types);
  }

  async updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse> {
    await this.dbManager.updateItem(salesItem, SalesItem, this.Types);
  }

  async deleteSalesItemById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await this.dbManager.deleteItemById(_id, SalesItem);
  }
}
