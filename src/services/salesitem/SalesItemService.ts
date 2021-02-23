import GetSalesItemsArg from "./types/args/GetSalesItemsArg";
import _IdAndSalesItemState from "./types/args/_IdAndSalesItemState";
import { SalesItem } from "./types/entities/SalesItem";
import _Id from "../../backk/types/id/_Id";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import GetSalesItemsByUserDefinedFiltersArg from "./types/args/GetSalesItemsByUserDefinedFiltersArg";
import { SalesItemState } from "./types/enums/SalesItemState";
import DeleteOldUnsoldSalesItemsArg from "./types/args/DeleteOldUnsoldSalesItemsArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import UserAccountId from "../../backk/types/useraccount/UserAccountId";
import { ErrorOr } from "../../backk/types/ErrorOr";

export default abstract class SalesItemService extends CrudResourceService {
  abstract deleteAllSalesItems(): ErrorOr<null>;
  abstract createSalesItem(arg: SalesItem): ErrorOr<SalesItem>;
  abstract getSalesItems(arg: GetSalesItemsArg): ErrorOr<SalesItem[]>;
  abstract getSalesItemsByUserDefinedFilters(arg: GetSalesItemsByUserDefinedFiltersArg): ErrorOr<SalesItem[]>;
  abstract getFollowedUsersSalesItems(arg: UserAccountId): ErrorOr<SalesItem[]>;
  abstract getSalesItem(arg: _Id): ErrorOr<SalesItem>;
  abstract updateSalesItem(arg: SalesItem): ErrorOr<null>;

  abstract updateSalesItemState(
    arg: _IdAndSalesItemState,
    requiredCurrentState?: SalesItemState
  ): ErrorOr<null>;

  abstract deleteOldUnsoldSalesItems(arg: DeleteOldUnsoldSalesItemsArg): ErrorOr<null>;
  abstract deleteSalesItem(arg: _IdAndUserAccountId): ErrorOr<null>;
}
