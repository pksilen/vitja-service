import ShoppingCart from './types/entities/ShoppingCart';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import CrudResourceService from '../../backk/service/crudresource/CrudResourceService';
import _Id from '../../backk/types/id/_Id';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import _IdAndUserAccountIdAndSalesItem from './types/args/_IdAndUserAccountIdAndSalesItem';

export default abstract class ShoppingCartService extends CrudResourceService {
  abstract deleteAllShoppingCarts(): Promise<void | ErrorResponse>;
  abstract createShoppingCart(arg: ShoppingCart): Promise<ShoppingCart | ErrorResponse>;

  abstract removeFromShoppingCart(
    arg: _IdAndUserAccountIdAndSalesItem
  ): Promise<ShoppingCart | ErrorResponse>;

  abstract addToShoppingCart(arg: _IdAndUserAccountIdAndSalesItem): Promise<ShoppingCart | ErrorResponse>;
  abstract getShoppingCart(arg: UserAccountId): Promise<ShoppingCart | ErrorResponse>;
  abstract emptyShoppingCart(arg: _IdAndUserAccountId): Promise<void | ErrorResponse>;
  abstract deleteShoppingCart(arg: _Id): Promise<void | ErrorResponse>;
}
