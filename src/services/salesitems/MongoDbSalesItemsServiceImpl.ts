import { Injectable } from '@nestjs/common';
import SalesItemsService from './SalesItemsService';
import dbManager from '../../dbManager';
import Backk, { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import { SalesItem } from './types/SalesItem';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';

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

  async getSalesItems(
    salesItemsFilters: SalesItemsFilters
  ): Promise<Array<Partial<SalesItem>> | ErrorResponse> {
    return await dbManager.execute((client) =>
      client
        .db(DB_NAME)
        .collection<SalesItem>(COLL_NAME)
        .find({})
        .project(Backk.getProjection(salesItemsFilters))
        .toArray()
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
