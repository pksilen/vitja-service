import { ErrorResponse, Id, IdAndUserId } from '../../backk/Backk';
import BaseService from '../../backk/BaseService';
import UserId from '../users/types/args/UserId';
import CreateShoppingCartArg from './types/args/CreateShoppingCartArg';
import ShoppingCartItem from './types/common/ShoppingCartItem';
import ShoppingCart from './types/entities/ShoppingCart';

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
  abstract deleteShoppingCartById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
