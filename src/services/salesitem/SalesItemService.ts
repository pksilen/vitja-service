import GetSalesItemsArg from "./types/args/GetSalesItemsArg";
import UpdateSalesItemStateArg from "./types/args/UpdateSalesItemStateArg";
import { SalesItem } from "./types/entities/SalesItem";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _Id from "../../backk/types/id/_Id";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import GetSalesItemsByUserDefinedFiltersArg from "./types/args/GetSalesItemsByUserDefinedFiltersArg";
import { SalesItemState } from "./types/enums/SalesItemState";
import DeleteOldUnsoldSalesItemsArg from "./types/args/DeleteOldUnsoldSalesItemsArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";

export default abstract class SalesItemService extends CrudResourceService {
  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(arg: SalesItem): Promise<SalesItem | ErrorResponse>;
  abstract getSalesItems(arg: GetSalesItemsArg): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItemsByUserDefinedFilters(
    arg: GetSalesItemsByUserDefinedFiltersArg
  ): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItem(arg: _Id): Promise<SalesItem | ErrorResponse>;
  abstract updateSalesItem(arg: SalesItem): Promise<void | ErrorResponse>;

  abstract updateSalesItemState(
    arg: UpdateSalesItemStateArg,
    requiredCurrentState?: SalesItemState
  ): Promise<void | ErrorResponse>;

  abstract deleteOldUnsoldSalesItems(arg: DeleteOldUnsoldSalesItemsArg): Promise<void | ErrorResponse>;
  abstract deleteSalesItem(arg: _IdAndUserAccountId): Promise<void | ErrorResponse>;
}
