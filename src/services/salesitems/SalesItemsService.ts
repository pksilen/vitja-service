import BaseService from "../../backk/service/BaseService";
import GetByUserIdArg from "../users/types/args/GetByUserIdArg";
import CreateSalesItemArg from "./types/args/CreateSalesItemArg";
import GetSalesItemsArg from "./types/args/GetSalesItemsArg";
import UpdateSalesItemArg from "./types/args/UpdateSalesItemArg";
import UpdateSalesItemStateArg from "./types/args/UpdateSalesItemStateArg";
import { SalesItem } from "./types/entities/SalesItem";
import IdAndUserId from "../../backk/types/id/IdAndUserId";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import IdsAndDefaultPostQueryOperationsArg from "../../backk/types/postqueryoperations/args/IdsAndDefaultPostQueryOperationsArg";
import _Id from "../../backk/types/id/_Id";

export default abstract class SalesItemsService extends BaseService {
  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(arg: CreateSalesItemArg): Promise<SalesItem | ErrorResponse>;
  abstract getSalesItems(arg: GetSalesItemsArg): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByUserId(arg: GetByUserIdArg): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds(arg: IdsAndDefaultPostQueryOperationsArg): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemById(arg: _Id): Promise<SalesItem | ErrorResponse>;
  abstract updateSalesItem(arg: UpdateSalesItemArg): Promise<void | ErrorResponse>;

  abstract updateSalesItemState(
    arg: UpdateSalesItemStateArg,
    requiredCurrentState?: 'forSale' | 'sold'
  ): Promise<void | ErrorResponse>;

  abstract deleteSalesItemById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
