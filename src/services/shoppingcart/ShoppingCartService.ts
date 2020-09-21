import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import ShoppingCartCreateDto from './types/ShoppingCartCreateDto';
import ShoppingCart from './types/ShoppingCart';
import ShoppingCartItem from './types/ShoppingCartItem';
import UserIdWrapper from "../users/types/UserIdWrapper";

export default abstract class ShoppingCartService {
  Types = {
    ShoppingCart,
    ShoppingCartItem,
    ShoppingCartCreateDto,
    UserIdWrapper
  };

  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;

  abstract createShoppingCart(
    shoppingCartCreateDto: ShoppingCartCreateDto
  ): Promise<IdWrapper | ErrorResponse>;

  abstract getShoppingCartByUserId(userIdWrapper: UserIdWrapper): Promise<ShoppingCart | ErrorResponse>;

  abstract updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse>;
  abstract deleteShoppingCartById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
