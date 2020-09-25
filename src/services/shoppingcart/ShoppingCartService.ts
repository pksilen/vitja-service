import { ErrorResponse, Id } from '../../backk/Backk';
import CreateShoppingCartArg from './types/args/CreateShoppingCartArg';
import ShoppingCart from './types/entities/ShoppingCart';
import ShoppingCartItem from './types/entities/ShoppingCartItem';
import UserId from '../users/types/args/UserId';
import BaseService from '../../backk/BaseService';

export default abstract class ShoppingCartService extends BaseService {
  Types = {
    ShoppingCart,
    ShoppingCartItem,
    CreateShoppingCartArg,
    UserId
  };

  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: CreateShoppingCartArg): Promise<Id | ErrorResponse>;
  abstract getShoppingCartByUserId(userId: UserId): Promise<ShoppingCart | ErrorResponse>;
  abstract updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse>;
  abstract deleteShoppingCartById(id: Id): Promise<void | ErrorResponse>;
}
