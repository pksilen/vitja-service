import UserId from "../useraccounts/types/args/UserId";
import ShoppingCart from "./types/entities/ShoppingCart";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _IdAndUserId from "../../backk/types/id/_IdAndUserId";
import _IdAndUserIdAndSalesItem from "./types/args/_IdAndUserIdAndSalesItem";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";

export default abstract class ShoppingCartsService extends CrudResourceService {
  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: ShoppingCart): Promise<ShoppingCart | ErrorResponse>;
  abstract removeFromShoppingCart(arg: _IdAndUserIdAndSalesItem): Promise<ShoppingCart | ErrorResponse>;
  abstract addToShoppingCart(arg: _IdAndUserIdAndSalesItem): Promise<ShoppingCart | ErrorResponse>;
  abstract getShoppingCart(arg: UserId): Promise<ShoppingCart | ErrorResponse>;
  abstract emptyShoppingCart(arg: _IdAndUserId): Promise<void | ErrorResponse>;
  abstract deleteShoppingCart(arg: _Id): Promise<void | ErrorResponse>;
}
