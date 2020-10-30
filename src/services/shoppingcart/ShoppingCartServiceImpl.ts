import { Injectable, Optional } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserId from '../users/types/args/UserId';
import ShoppingCartService from './ShoppingCartService';
import CreateShoppingCartArg from './types/args/CreateShoppingCartArg';
import ShoppingCart from './types/entities/ShoppingCart';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import IdAndUserId from '../../backk/types/id/IdAndUserId';
import getErrorResponseOrResultOf from '../../backk/utils/getErrorResponseOrResultOf';
import ShoppingCartItem from './types/entities/ShoppingCartItem';
import { SHOPPING_CART_ALREADY_EXISTS } from './errors/shoppingCartServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import AddShoppingCartItemArg from './types/args/AddShoppingCartItemArg';
import RemoveShoppingCartItemByIdArg from './types/args/RemoveShoppingCartItemByIdArg';
import { SalesItem } from '../salesitems/types/entities/SalesItem';
import { SALES_ITEM_STATE_MUST_BE_FOR_SALE } from '../salesitems/errors/salesItemsServiceErrors';
import SalesItemsService from '../salesitems/SalesItemsService';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(
    dbManager: AbstractDbManager,
    private readonly salesItemService: SalesItemsService,
    @Optional()
    readonly Types = {
      AddShoppingCartItemArg,
      CreateShoppingCartArg,
      ShoppingCart,
      ShoppingCartItem,
      UserId,
      RemoveShoppingCartItemByIdArg
    }
  ) {
    super(dbManager, Types);
  }

  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(ShoppingCart);
  }

  @NoCaptcha()
  @AllowForSelf()
  @Errors([SHOPPING_CART_ALREADY_EXISTS])
  async createShoppingCart(arg: CreateShoppingCartArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.createEntity(arg, ShoppingCart, {
      hookFunc: async () =>
        getErrorResponseOrResultOf(
          await this.dbManager.getEntitiesCount({ userId: arg.userId }, ShoppingCart),
          (shoppingCartCount) => shoppingCartCount === 0
        ),
      error: SHOPPING_CART_ALREADY_EXISTS
    });
  }

  @AllowForSelf()
  removeShoppingCartItemById({
                               shoppingCartId,
                               shoppingCartItemId
                             }: RemoveShoppingCartItemByIdArg): Promise<void | ErrorResponse> {
    return this.dbManager.removeSubEntityById(
      shoppingCartId,
      'shoppingCartItems',
      shoppingCartItemId,
      ShoppingCart,
      {
        entityJsonPath: `shoppingCartItems[?(@.id == '${shoppingCartItemId}')]`,
        hookFunc: async ({ salesItemId }) =>
          await this.salesItemService.updateSalesItemState({ _id: salesItemId, state: 'forSale' })
      }
    );
  }

  @AllowForSelf()
  addShoppingCartItem({
    shoppingCartId,
    salesItemId
  }: AddShoppingCartItemArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.addSubEntity(
      shoppingCartId,
      'shoppingCartItems',
      { salesItemId },
      ShoppingCart,
      ShoppingCartItem,
      {
        hookFunc: async () =>
          getErrorResponseOrResultOf(
            await this.salesItemService.getSalesItemById({ _id: salesItemId }),
            (salesItem) => salesItem.state === 'forSale'
          ),
        error: SALES_ITEM_STATE_MUST_BE_FOR_SALE
      }
    );
  }

  @AllowForSelf()
  getShoppingCartByUserId({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getEntityBy('userId', userId, ShoppingCart);
  }

  @AllowForSelf()
  deleteShoppingCartById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, ShoppingCart);
  }
}
