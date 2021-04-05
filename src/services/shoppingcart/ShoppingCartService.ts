import ShoppingCart from './types/entities/ShoppingCart';
import CrudEntityService from '../../backk/service/crudentity/CrudEntityService';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import { ErrorDef } from '../../backk/dbmanager/hooks/PreHook';
import UserAccountIdAndSalesItemId from './types/args/UserAccountIdAndSalesItemId';

export default abstract class ShoppingCartService extends CrudEntityService {
  abstract deleteAllShoppingCarts(): PromiseErrorOr<null>;
  abstract getShoppingCart(arg: UserAccountId): PromiseErrorOr<ShoppingCart>;
  abstract addToShoppingCart(arg: UserAccountIdAndSalesItemId): PromiseErrorOr<null>;
  abstract removeFromShoppingCart(arg: UserAccountIdAndSalesItemId): PromiseErrorOr<null>;
  abstract emptyShoppingCart(arg: UserAccountId): PromiseErrorOr<null>;
  abstract deleteShoppingCart(arg: UserAccountId): PromiseErrorOr<null>;

  abstract getShoppingCartOrErrorIfEmpty(
    userAccountId: string,
    error: ErrorDef
  ): PromiseErrorOr<ShoppingCart>;
}
