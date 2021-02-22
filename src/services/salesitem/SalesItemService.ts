import GetSalesItemsArg from "./types/args/GetSalesItemsArg";
import UpdateSalesItemStateArg from "./types/args/UpdateSalesItemStateArg";
import { SalesItem } from "./types/entities/SalesItem";
import { BackkError } from "../../backk/types/BackkError";
import _Id from "../../backk/types/id/_Id";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import GetSalesItemsByUserDefinedFiltersArg from "./types/args/GetSalesItemsByUserDefinedFiltersArg";
import { SalesItemState } from "./types/enums/SalesItemState";
import DeleteOldUnsoldSalesItemsArg from "./types/args/DeleteOldUnsoldSalesItemsArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import UserAccountId from "../../backk/types/useraccount/UserAccountId";

export default abstract class SalesItemService extends CrudResourceService {
  abstract deleteAllSalesItems(): Promise<BackkError | null>;
  abstract createSalesItem(arg: SalesItem): Promise<[SalesItem, BackkError | null]>;
  abstract getSalesItems(arg: GetSalesItemsArg): Promise<[SalesItem[], BackkError | null]>;

  abstract getSalesItemsByUserDefinedFilters(
    arg: GetSalesItemsByUserDefinedFiltersArg
  ): Promise<[SalesItem[], BackkError | null]>;

  abstract getFollowedUsersSalesItems(arg: UserAccountId): Promise<[SalesItem[], BackkError | null]>;
  abstract getSalesItem(arg: _Id): Promise<[SalesItem, BackkError | null]>;
  abstract updateSalesItem(arg: SalesItem): Promise<BackkError | null>;

  abstract updateSalesItemState(
    arg: UpdateSalesItemStateArg,
    requiredCurrentState?: SalesItemState
  ): Promise<BackkError | null>;

  abstract deleteOldUnsoldSalesItems(arg: DeleteOldUnsoldSalesItemsArg): Promise<BackkError | null>;
  abstract deleteSalesItem(arg: _IdAndUserAccountId): Promise<BackkError | null>;
}
