import UserId from "../users/types/args/UserId";
import ShoppingCart from "./types/entities/ShoppingCart";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _IdAndUserId from "../../backk/types/id/_IdAndUserId";
import AddToShoppingCartArg from "./types/args/AddToShoppingCartArg";
import RemoveFromShoppingCartArg from "./types/args/RemoveFromShoppingCartArg";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";

export default abstract class ShoppingCartService extends CrudResourceService {
  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: ShoppingCart): Promise<ShoppingCart | ErrorResponse>;
  abstract removeFromShoppingCart(arg: RemoveFromShoppingCartArg): Promise<ShoppingCart | ErrorResponse>
  abstract addToShoppingCart(arg: AddToShoppingCartArg): Promise<ShoppingCart | ErrorResponse>
  abstract getShoppingCart(arg: UserId): Promise<ShoppingCart | ErrorResponse>;
  abstract emptyShoppingCart(arg: _IdAndUserId): Promise<void | ErrorResponse>;
}
