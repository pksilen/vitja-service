import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import ShoppingCartCreateDto from './types/ShoppingCartCreateDto';
import ShoppingCart from './types/ShoppingCart';
import ShoppingCartItem from './types/ShoppingCartItem';

export default abstract class ShoppingCartService {
  Types = {
    IdWrapper,
    ShoppingCart,
    ShoppingCartItem,
    ShoppingCartCreateDto
  };

  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;

  abstract createShoppingCart(
    shoppingCartCreateDto: ShoppingCartCreateDto
  ): Promise<IdWrapper | ErrorResponse>;

  abstract getShoppingCartByUserId(idWrapper: IdWrapper): Promise<ShoppingCart | ErrorResponse>;
  abstract updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse>;
  abstract deleteShoppingCartById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
