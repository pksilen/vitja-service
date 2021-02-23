import ShoppingCart from './types/entities/ShoppingCart';
import { BackkError } from '../../backk/types/BackkError';
import CrudResourceService from '../../backk/service/crudresource/CrudResourceService';
import _Id from '../../backk/types/id/_Id';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import _IdAndUserAccountIdAndSalesItem from './types/args/_IdAndUserAccountIdAndSalesItem';
import { ErrorOr } from '../../backk/types/ErrorOr';

export default abstract class ShoppingCartService extends CrudResourceService {
  abstract deleteAllShoppingCarts(): ErrorOr<null>;
  abstract createShoppingCart(arg: ShoppingCart): ErrorOr<ShoppingCart>;
  abstract removeFromShoppingCart(arg: _IdAndUserAccountIdAndSalesItem): ErrorOr<ShoppingCart>;
  abstract addToShoppingCart(arg: _IdAndUserAccountIdAndSalesItem): ErrorOr<ShoppingCart>;
  abstract getShoppingCart(arg: UserAccountId): ErrorOr<ShoppingCart>;
  abstract emptyShoppingCart(arg: _IdAndUserAccountId): ErrorOr<null>;
  abstract deleteShoppingCart(arg: _Id): ErrorOr<null>;
}
