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
import awaitOperationAndGetResultOfPredicate from '../../backk/utils/getErrorResponseOrResultOf';
import { SALES_ITEM_ALREADY_SOLD, SHOPPING_CART_ALREADY_EXISTS } from './errors/shoppingCartServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import _IdAndUserIdAndSalesItem from './types/args/_IdAndUserIdAndSalesItem';
import SalesItemsService from '../salesitems/SalesItemsService';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { ExpectReturnValueToContainInTests } from '../../backk/decorators/service/function/ExpectReturnValueToContainInTests';
import { NoAutoTest } from '../../backk/decorators/service/function/NoAutoTest';
import { Delete } from '../../backk/decorators/service/function/Delete';
import ShoppingCartOrOrderSalesItem from '../orders/types/entities/ShoppingCartOrOrderSalesItem';
import { HttpStatusCodes } from '../../backk/constants/constants';
import isErrorResponse from '../../backk/errors/isErrorResponse';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import _Id from '../../backk/types/id/_Id';

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
      isSuccessfulOrTrue: () =>
        awaitOperationAndGetResultOfPredicate(
          this.dbManager.getEntitiesCount({ userId: arg.userId }, ShoppingCart),
          (shoppingCartCount) => shoppingCartCount === 0
        ),
      errorMessage: SHOPPING_CART_ALREADY_EXISTS
    });
  }

  @AllowForSelf()
  @ExpectReturnValueToContainInTests({ shoppingCartItems: [] })
  removeFromShoppingCart({
    _id,
    salesItem
  }: _IdAndUserIdAndSalesItem): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.removeSubEntityById(_id, 'salesItems', salesItem._id, ShoppingCart, () =>
      this.salesItemService.updateSalesItemState({ _id: salesItem._id, newState: 'forSale' })
    );
  }

  @AllowForSelf()
  @Errors([SALES_ITEM_ALREADY_SOLD])
  addToShoppingCart({ _id, salesItem }: _IdAndUserIdAndSalesItem): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.addSubEntity(
      _id,
      'any',
      'salesItems',
      salesItem,
      ShoppingCart,
      ShoppingCartOrOrderSalesItem,
      {
        isSuccessfulOrTrue: () =>
          awaitOperationAndGetResultOfPredicate(
            this.salesItemService.getSalesItem({ _id: salesItem._id }),
            (salesItem) => salesItem.state === 'forSale'
          ),
        errorMessage: SALES_ITEM_ALREADY_SOLD
      }
    );
  }

  @AllowForSelf()
  getShoppingCart({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      const shoppingCartOrErrorResponse = await this.dbManager.getEntityWhere('userId', userId, ShoppingCart);

      if (isErrorResponse(shoppingCartOrErrorResponse, HttpStatusCodes.NOT_FOUND)) {
        return await this.dbManager.createEntity({ userId, salesItems: [] }, ShoppingCart);
      }

      return shoppingCartOrErrorResponse;
    });
  }

  @AllowForSelf()
  @Delete()
  @NoAutoTest()
  emptyShoppingCart({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.deleteShoppingCart({ _id });
  }

  @AllowForServiceInternalUse()
  deleteShoppingCart({ _id }: _Id) {
    return this.dbManager.deleteEntityById(_id, ShoppingCart);
  }
}
