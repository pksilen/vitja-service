import { Injectable } from '@nestjs/common';
import SalesItemsService from './SalesItemsService';
import dbManager from '../../backk/dbmanager/mongoDbManager';
import { ErrorResponse, getMongoDbProjection, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import { SalesItem } from './types/SalesItem';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import { text } from 'express';

const DB_NAME = 'vitja';
const COLL_NAME = 'salesItems';

@Injectable()
export default class MongodbSalesItemsServiceImpl extends SalesItemsService {
  async deleteAllSalesItems(): Promise<void | ErrorResponse> {
    return await dbManager.deleteAllItems(DB_NAME, COLL_NAME);
  }

  async createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(
      { ...salesItemWithoutId, createdTimestampInMillis: Date.now() },
      DB_NAME,
      COLL_NAME
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
    return await dbManager.getItems(
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
      postQueryOperations, DB_NAME, COLL_NAME
    );
  }

  async getSalesItemsByUserId({ userId }: UserIdWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await dbManager.getItemsBy<SalesItem>('userId', userId, DB_NAME, COLL_NAME);
  }

  async getSalesItemsByIds({ _ids }: IdsWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await dbManager.getItemsByIds(_ids, DB_NAME, COLL_NAME);
  }

  async getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await dbManager.getItemById(_id, DB_NAME, COLL_NAME);
  }

  async updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse> {
    await dbManager.updateItem(salesItem, DB_NAME, COLL_NAME);
  }

  async deleteSalesItemById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(_id, DB_NAME, COLL_NAME);
  }
}
