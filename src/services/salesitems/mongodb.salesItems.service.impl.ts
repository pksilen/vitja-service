import { Injectable } from '@nestjs/common';
import SalesItemsService, { SalesItemsFilters, SalesItem, SalesItemWithoutId } from './salesitems.service';
import dbManager from '../../dbManager';
import Backk, { ErrorResponse, IdWrapper } from '../../backk/Backk';

const DB_NAME = 'vitja';
const COLL_NAME = 'salesItems';

@Injectable()
export default class MongodbSalesItemsServiceImpl extends SalesItemsService {
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

  async getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await dbManager.getItemById(idWrapper._id, DB_NAME, COLL_NAME);
  }

  async createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(salesItemWithoutId, DB_NAME, COLL_NAME);
  }

  async deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(idWrapper._id, DB_NAME, COLL_NAME);
  }

  async updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse> {
    await dbManager.updateItem(salesItem, DB_NAME, COLL_NAME);
  }
}
