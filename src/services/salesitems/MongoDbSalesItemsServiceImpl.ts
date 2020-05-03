import { Injectable } from '@nestjs/common';
import SalesItemsService from './SalesItemsService';
import dbManager from '../../backk/dbmanager/MongoDbManager';
import { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import { SalesItem } from './types/SalesItem';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import DbManager from '../../backk/dbmanager/DbManager';

@Injectable()
export default class MongodbSalesItemsServiceImpl extends SalesItemsService {
  constructor(private readonly dbManager: DbManager) {
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
    return await dbManager.getItemsByIds(_ids, DB_NAME, SalesItem);
  }

  async getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await dbManager.getItemById(_id, DB_NAME, SalesItem);
  }

  async updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse> {
    await dbManager.updateItem(salesItem, DB_NAME, SalesItem);
  }

  async deleteSalesItemById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(_id, DB_NAME, SalesItem);
  }
}
