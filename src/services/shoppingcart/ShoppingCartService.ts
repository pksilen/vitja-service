import ShoppingCart from './types/entities/ShoppingCart';
import { BackkError } from '../../backk/types/BackkError';
import CrudResourceService from '../../backk/service/crudresource/CrudResourceService';
import _Id from '../../backk/types/id/_Id';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import _IdAndUserAccountIdAndSalesItem from './types/args/_IdAndUserAccountIdAndSalesItem';

export default abstract class ShoppingCartService extends CrudResourceService {
  abstract deleteAllShoppingCarts(): Promise<BackkError | null>;
  abstract createShoppingCart(arg: ShoppingCart): Promise<ShoppingCar[T, BackkError | null]>;

  abstract removeFromShoppingCart(
    arg: _IdAndUserAccountIdAndSalesItem
  ): Promise<ShoppingCar[T, BackkError | null]>;

  abstract addToShoppingCart(arg: _IdAndUserAccountIdAndSalesItem): Promise<ShoppingCar[T, BackkError | null]>;
  abstract getShoppingCart(arg: UserAccountId): Promise<ShoppingCar[T, BackkError | null]>;
  abstract emptyShoppingCart(arg: _IdAndUserAccountId): Promise<BackkError | null>;
  abstract deleteShoppingCart(arg: _Id): Promise<BackkError | null>;
}
