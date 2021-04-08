import GetSalesItemsArg from './types/args/GetSalesItemsArg';
import { SalesItem } from './types/entities/SalesItem';
import _Id from '../../backk/types/id/_Id';
import CrudEntityService from '../../backk/service/crudentity/CrudEntityService';
import GetSalesItemsByUserDefinedFiltersArg from './types/args/GetSalesItemsByUserDefinedFiltersArg';
import { SalesItemState } from './types/enums/SalesItemState';
import DeleteOldUnsoldSalesItemsArg from './types/args/DeleteOldUnsoldSalesItemsArg';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import FollowedUserSalesItem from './types/responses/FollowedUserSalesItem';
import ShoppingCartOrOrderSalesItem from '../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem';
import ChangeExpiredReservedSalesItemStatesToForSaleArg from './types/args/ChangeExpiredReservedSalesItemStatesToForSaleArg';

export default abstract class SalesItemService extends CrudEntityService {
  abstract deleteAllSalesItems(): PromiseErrorOr<null>;
  abstract createSalesItem(arg: SalesItem): PromiseErrorOr<SalesItem>;
  abstract getSalesItems(arg: GetSalesItemsArg): PromiseErrorOr<SalesItem[]>;

  abstract getSalesItemsByUserDefinedFilters(
    arg: GetSalesItemsByUserDefinedFiltersArg
  ): PromiseErrorOr<SalesItem[]>;

  abstract getFollowedUsersSalesItems(arg: UserAccountId): PromiseErrorOr<FollowedUserSalesItem[]>;
  abstract getSalesItem(arg: _Id): PromiseErrorOr<SalesItem>;
  abstract followSalesItemPriceChange(arg: _IdAndUserAccountId): PromiseErrorOr<null>;
  abstract unfollowSalesItemPriceChange(arg: _IdAndUserAccountId): PromiseErrorOr<null>;
  abstract toggleLikeSalesItem(arg: _IdAndUserAccountId): PromiseErrorOr<null>;
  abstract updateSalesItem(arg: SalesItem): PromiseErrorOr<null>;

  abstract changeExpiredReservedSalesItemStatesToForSale(
    arg: ChangeExpiredReservedSalesItemStatesToForSaleArg
  ): PromiseErrorOr<null>;

  abstract deleteOldUnsoldSalesItemsDaily(arg: DeleteOldUnsoldSalesItemsArg): PromiseErrorOr<null>;
  abstract deleteSalesItem(arg: _IdAndUserAccountId): PromiseErrorOr<null>;

  abstract updateSalesItemStates(
    salesItems: ShoppingCartOrOrderSalesItem[],
    newState: SalesItemState,
    requiredCurrentState?: SalesItemState,
    buyerUserAccountId?: string
  ): PromiseErrorOr<null>;

  abstract updateSalesItemState(
    _id: string,
    newState: SalesItemState,
    requiredCurrentState?: SalesItemState,
    buyerUserAccountId?: string | null
  ): PromiseErrorOr<null>;

  abstract updateSalesItemStatesByFilters(
    salesItemIds: string[],
    newState: SalesItemState,
    currentStateFilter: SalesItemState,
    buyerUserAccountIdFilter: string
  ): PromiseErrorOr<null>;
}
