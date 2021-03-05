import ShoppingCart from "./types/entities/ShoppingCart";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import UserAccountId from "../../backk/types/useraccount/UserAccountId";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import _IdAndUserAccountIdAndSalesItemId from "./types/args/_IdAndUserAccountIdAndSalesItemId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

export default abstract class ShoppingCartService extends CrudResourceService {
  abstract deleteAllShoppingCarts(): PromiseOfErrorOr<null>;
  abstract createShoppingCart(arg: ShoppingCart): PromiseOfErrorOr<ShoppingCart>;
  abstract getShoppingCart(arg: UserAccountId): PromiseOfErrorOr<ShoppingCart>;
  abstract addToShoppingCart(arg: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null>;
  abstract removeFromShoppingCart(arg: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null>;
  abstract emptyShoppingCart(arg: _IdAndUserAccountId): PromiseOfErrorOr<null>;
  abstract deleteShoppingCart(arg: _Id): PromiseOfErrorOr<null>;
}
