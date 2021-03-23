import GetSalesItemsArg from './types/args/GetSalesItemsArg';
import { SalesItem } from './types/entities/SalesItem';
import _Id from '../../backk/types/id/_Id';
import CrudEntityService from '../../backk/service/crudentity/CrudEntityService';
import GetSalesItemsByUserDefinedFiltersArg from './types/args/GetSalesItemsByUserDefinedFiltersArg';
import { SalesItemState } from './types/enums/SalesItemState';
import DeleteOldUnsoldSalesItemsArg from './types/args/DeleteOldUnsoldSalesItemsArg';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';
import FollowedUserSalesItem from './types/responses/FollowedUserSalesItem';
import ShoppingCartOrOrderSalesItem from '../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem';
import ChangeExpiredReservedSalesItemStatesToForSaleArg from './types/args/ChangeExpiredReservedSalesItemStatesToForSaleArg';

export default abstract class SalesItemService extends CrudEntityService {
  abstract deleteAllSalesItems(): PromiseOfErrorOr<null>;
  abstract createSalesItem(arg: SalesItem): PromiseOfErrorOr<SalesItem>;
  abstract getSalesItems(arg: GetSalesItemsArg): PromiseOfErrorOr<SalesItem[]>;

  abstract getSalesItemsByUserDefinedFilters(
    arg: GetSalesItemsByUserDefinedFiltersArg
  ): PromiseOfErrorOr<SalesItem[]>;

  abstract getFollowedUsersSalesItems(arg: UserAccountId): PromiseOfErrorOr<FollowedUserSalesItem[]>;
  abstract getSalesItem(arg: _Id): PromiseOfErrorOr<SalesItem>;
  abstract updateSalesItem(arg: SalesItem): PromiseOfErrorOr<null>;

  abstract updateSalesItemStates(
    salesItems: ShoppingCartOrOrderSalesItem[],
    newState: SalesItemState,
    requiredCurrentState?: SalesItemState,
    buyerUserAccountId?: string
  ): PromiseOfErrorOr<null>;

  abstract updateSalesItemState(
    _id: string,
    newState: SalesItemState,
    requiredCurrentState?: SalesItemState,
    buyerUserAccountId?: string | null
  ): PromiseOfErrorOr<null>;

  abstract changeExpiredReservedSalesItemStatesToForSale(
    arg: ChangeExpiredReservedSalesItemStatesToForSaleArg
  ): PromiseOfErrorOr<null>;

  abstract deleteOldUnsoldSalesItems(arg: DeleteOldUnsoldSalesItemsArg): PromiseOfErrorOr<null>;
  abstract deleteSalesItem(arg: _IdAndUserAccountId): PromiseOfErrorOr<null>;
}
