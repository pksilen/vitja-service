import ShoppingCart from "./types/entities/ShoppingCart";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import UserAccountId from "../../backk/types/useraccount/UserAccountId";
import _IdAndUserAccountIdAndSalesItemId from "./types/args/_IdAndUserAccountIdAndSalesItemId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import { ErrorDef } from "../../backk/dbmanager/hooks/PreHook";

export default abstract class ShoppingCartService extends CrudEntityService {
  abstract deleteAllShoppingCarts(): PromiseOfErrorOr<null>;
  abstract addToShoppingCart(arg: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null>;
  abstract getShoppingCart(arg: UserAccountId): PromiseOfErrorOr<ShoppingCart>;

  abstract getShoppingCartOrErrorIfEmpty(
    userAccountId: string,
    error: ErrorDef
  ): PromiseOfErrorOr<ShoppingCart>;

  abstract removeFromShoppingCart(arg: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null>;
  abstract emptyShoppingCart(arg: UserAccountId): PromiseOfErrorOr<null>;
  abstract deleteShoppingCart(arg: UserAccountId): PromiseOfErrorOr<null>;
}
