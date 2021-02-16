import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserId from '../users/types/args/UserId';
import ShoppingCartService from './ShoppingCartService';
import ShoppingCart from './types/entities/ShoppingCart';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import _IdAndUserId from '../../backk/types/id/_IdAndUserId';
import awaitDbOperationAndGetResultOfPredicate from '../../backk/utils/getErrorResponseOrResultOf';
import ShoppingCartItem from './types/entities/ShoppingCartItem';
import { SALES_ITEM_ALREADY_SOLD, SHOPPING_CART_ALREADY_EXISTS } from './errors/shoppingCartServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import AddToShoppingCartArg from './types/args/AddToShoppingCartArg';
import RemoveFromShoppingCartArg from './types/args/RemoveFromShoppingCartArg';
import SalesItemsService from '../salesitems/SalesItemsService';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { ExpectReturnValueToContainInTests } from '../../backk/decorators/service/function/ExpectReturnValueToContainInTests';
import { NoAutoTest } from '../../backk/decorators/service/function/NoAutoTest';
import { Delete } from '../../backk/decorators/service/function/Delete';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager, private readonly salesItemService: SalesItemsService) {
    super(dbManager);
  }

  @AllowForTests()
  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(ShoppingCart);
  }

  @NoCaptcha()
  @AllowForSelf()
  @Errors([SHOPPING_CART_ALREADY_EXISTS])
  async createShoppingCart(arg: ShoppingCart): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.createEntity(arg, ShoppingCart, {
      preHookFunc: () =>
        awaitDbOperationAndGetResultOfPredicate(
          this.dbManager.getEntitiesCount({ userId: arg.userId }, ShoppingCart),
          (shoppingCartCount) => shoppingCartCount === 0
        ),
      errorMessageOnPreHookFuncExecFailure: SHOPPING_CART_ALREADY_EXISTS
    });
  }

  @AllowForSelf()
  @ExpectReturnValueToContainInTests({ shoppingCartItems: [] })
  removeFromShoppingCart({
    _id,
    shoppingCartItemId
  }: RemoveFromShoppingCartArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'shoppingCartItems', shoppingCartItemId, ShoppingCart, {
      entityJsonPathForPreHookFuncArg: `shoppingCartItems[?(@.id == '${shoppingCartItemId}')]`,
      preHookFunc: ([{ salesItemId }]) =>
        this.salesItemService.updateSalesItemState({ _id: salesItemId, newState: 'forSale' })
    });
  }

  @AllowForSelf()
  addToShoppingCart({ _id, salesItemId }: AddToShoppingCartArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      'any',
      'shoppingCartItems',
      { salesItemId },
      ShoppingCart,
      ShoppingCartItem,
      {
        preHookFunc: () =>
          awaitDbOperationAndGetResultOfPredicate(
            this.salesItemService.getSalesItem({ _id: salesItemId }),
            (salesItem) => salesItem.state === 'forSale'
          ),
        errorMessageOnPreHookFuncExecFailure: SALES_ITEM_ALREADY_SOLD
      }
    );
  }

  @AllowForSelf()
  getShoppingCart({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getEntityWhere('userId', userId, ShoppingCart);
  }

  @AllowForSelf()
  @Delete()
  @NoAutoTest()
  emptyShoppingCart({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, ShoppingCart);
  }
}
