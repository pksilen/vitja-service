import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import { SalesItem } from './types/SalesItem';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import SalesItemsService from "./SalesItemsService";

@Injectable()
export default class MongodbSalesItemsServiceImpl extends SalesItemsService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  async deleteAllSalesItems(): Promise<void | ErrorResponse> {
    return await this.dbManager.deleteAllItems(SalesItem);
  }

  async createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await this.dbManager.createItem(
      { ...salesItemWithoutId, createdTimestampInMillis: Date.now() },
      SalesItem
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
    return await this.dbManager.getItems(
      {
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
      postQueryOperations,
      SalesItem
    );
  }

  async getSalesItemsByUserId({ userId }: UserIdWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await this.dbManager.getItemsBy<SalesItem>('userId', userId, SalesItem);
  }

  async getSalesItemsByIds({ _ids }: IdsWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await this.dbManager.getItemsByIds(_ids, SalesItem);
  }

  async getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await this.dbManager.getItemById(_id, SalesItem);
  }

  async updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse> {
    await this.dbManager.updateItem(salesItem, SalesItem);
  }

  async deleteSalesItemById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await this.dbManager.deleteItemById(_id, SalesItem);
  }
}
