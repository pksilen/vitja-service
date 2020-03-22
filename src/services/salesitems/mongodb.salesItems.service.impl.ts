import { Injectable } from '@nestjs/common';
import SalesItemsService, { SalesItemsFilters, SalesItem, SalesItemWithoutId } from './salesitems.service';
import dbManager from '../../dbManager';
import Backk, { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import ReturnType from '../../backk/getServiceTypeNames';

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

  async getSalesItemsByUserId(idWrapper: IdWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await dbManager.getItemsBy<SalesItem>('userId', idWrapper._id, DB_NAME, COLL_NAME);
  }

  async getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse> {
    return await dbManager.getItemById(idWrapper._id, DB_NAME, COLL_NAME);
  }

  async getSalesItemsByIds(idsWrapper: IdsWrapper): Promise<SalesItem[] | ErrorResponse> {
    return await dbManager.getItemsByIds(idsWrapper._ids, DB_NAME, COLL_NAME);
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
