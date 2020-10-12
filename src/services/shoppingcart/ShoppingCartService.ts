import { ErrorResponse, IdAndUserId } from '../../backk/Backk';
import BaseService from '../../backk/BaseService';
import UserId from '../users/types/args/UserId';
import CreateShoppingCartArg from './types/args/CreateShoppingCartArg';
import ShoppingCart from './types/entities/ShoppingCart';
import ShoppingCartItem from './types/entities/ShoppingCartItem';

export default abstract class ShoppingCartService extends BaseService {
  Types = {
    ShoppingCart,
    ShoppingCartItem,
    CreateShoppingCartArg,
    UserId
  };

  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: CreateShoppingCartArg): Promise<ShoppingCart | ErrorResponse>;
  abstract getShoppingCartByUserId(userId: UserId): Promise<ShoppingCart | ErrorResponse>;
  abstract updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse>;
  abstract deleteShoppingCartById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
