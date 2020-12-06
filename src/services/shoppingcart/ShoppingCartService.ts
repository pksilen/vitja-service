import BaseService from "../../backk/service/BaseService";
import UserId from "../users/types/args/UserId";
import ShoppingCart from "./types/entities/ShoppingCart";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _IdAndUserId from "../../backk/types/id/_IdAndUserId";
import AddShoppingCartItemArg from "./types/args/AddShoppingCartItemArg";
import RemoveShoppingCartItemByIdArg from "./types/args/RemoveShoppingCartItemByIdArg";

export default abstract class ShoppingCartService extends BaseService {
  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: ShoppingCart): Promise<ShoppingCart | ErrorResponse>;
  abstract removeShoppingCartItemById(arg: RemoveShoppingCartItemByIdArg): Promise<void | ErrorResponse>
  abstract addShoppingCartItem(arg: AddShoppingCartItemArg): Promise<ShoppingCart | ErrorResponse>
  abstract getShoppingCartByUserId(arg: UserId): Promise<ShoppingCart | ErrorResponse>;
  abstract deleteShoppingCartById(arg: _IdAndUserId): Promise<void | ErrorResponse>;
}
