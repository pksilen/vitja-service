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
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import FollowedUserSalesItem from "./types/responses/FollowedUserSalesItem";

export default abstract class SalesItemService extends CrudResourceService {
  abstract deleteAllSalesItems(): PromiseOfErrorOr<null>;
  abstract createSalesItem(arg: SalesItem): PromiseOfErrorOr<SalesItem>;
  abstract getSalesItems(arg: GetSalesItemsArg): PromiseOfErrorOr<SalesItem[]>;
  abstract getSalesItemsByUserDefinedFilters(arg: GetSalesItemsByUserDefinedFiltersArg): PromiseOfErrorOr<SalesItem[]>;
  abstract getFollowedUsersSalesItems(arg: UserAccountId): PromiseOfErrorOr<FollowedUserSalesItem[]>;
  abstract getSalesItem(arg: _Id): PromiseOfErrorOr<SalesItem>;
  abstract updateSalesItem(arg: SalesItem): PromiseOfErrorOr<null>;

  abstract updateSalesItemState(
    arg: _IdAndSalesItemState,
    requiredCurrentState?: SalesItemState
  ): PromiseOfErrorOr<null>;

  abstract deleteOldUnsoldSalesItems(arg: DeleteOldUnsoldSalesItemsArg): PromiseOfErrorOr<null>;
  abstract deleteSalesItem(arg: _IdAndUserAccountId): PromiseOfErrorOr<null>;
}
