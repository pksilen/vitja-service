import BaseService from "../../backk/service/basetypes/BaseService";
import UserId from "../users/types/args/UserId";
import CreateShoppingCartArg from "./types/args/CreateShoppingCartArg";
import ShoppingCart from "./types/entities/ShoppingCart";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import IdAndUserId from "../../backk/types/id/IdAndUserId";

export default abstract class ShoppingCartService extends BaseService {
  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: CreateShoppingCartArg): Promise<ShoppingCart | ErrorResponse>;
  abstract getShoppingCartByUserId(userId: UserId): Promise<ShoppingCart | ErrorResponse>;
  abstract updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse>;
  abstract deleteShoppingCartById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
