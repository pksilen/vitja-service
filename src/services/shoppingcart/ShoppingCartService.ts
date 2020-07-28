import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import ShoppingCartWithoutId from './types/ShoppingCartWithoutId';
import ShoppingCart from './types/ShoppingCart';
import ShoppingCartItem from './types/ShoppingCartItem';

export default abstract class ShoppingCartService {
  Types = {
    IdWrapper,
    ShoppingCart,
    ShoppingCartItem,
    ShoppingCartWithoutId,
    UserIdAndPaging
  };

  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(shoppingCartWithoutId: ShoppingCartWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract getShoppingCartByUserId({ userId }: UserIdAndPaging): Promise<ShoppingCart | ErrorResponse>;
  abstract updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse>;
  abstract deleteShoppingCartById({ _id }: IdWrapper): Promise<void | ErrorResponse>;
}
