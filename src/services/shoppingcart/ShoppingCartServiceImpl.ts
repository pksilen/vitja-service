import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import ShoppingCartService from './ShoppingCartService';
import ShoppingCart from './types/entities/ShoppingCart';
import { SALES_ITEM_ALREADY_SOLD, SHOPPING_CART_ALREADY_EXISTS } from './errors/shoppingCartServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import SalesItemService from '../salesitem/SalesItemService';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { NoAutoTest } from '../../backk/decorators/service/function/NoAutoTest';
import { Delete } from '../../backk/decorators/service/function/Delete';
import { HttpStatusCodes } from '../../backk/constants/constants';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import _Id from '../../backk/types/id/_Id';
import ShoppingCartOrOrderSalesItem from './types/entities/ShoppingCartOrOrderSalesItem';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import _IdAndUserAccountIdAndSalesItemId from './types/args/_IdAndUserAccountIdAndSalesItemId';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager, private readonly salesItemService: SalesItemService) {
    super(dbManager);
  }

  @AllowForTests()
  deleteAllShoppingCarts(): PromiseOfErrorOr<null> {
    return this.dbManager.deleteAllEntities(ShoppingCart);
  }

  @NoCaptcha()
  @AllowForSelf()
  @Errors([SHOPPING_CART_ALREADY_EXISTS])
  async createShoppingCart(arg: ShoppingCart): PromiseOfErrorOr<ShoppingCart> {
    return this.dbManager.createEntity(arg, ShoppingCart, {
      preHooks: {
        isSuccessfulOrTrue: async () => {
          const [shoppingCartCount] = await this.dbManager.getEntitiesCount(
            { userAccountId: arg.userAccountId },
            ShoppingCart
          );

          return shoppingCartCount === 0;
        },
        errorMessage: SHOPPING_CART_ALREADY_EXISTS
      }
    });
  }

  @AllowForSelf()
  @Errors([SALES_ITEM_ALREADY_SOLD])
  addToShoppingCart({ _id, salesItemId }: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.addSubEntity(
      _id,
      'salesItems',
      { _id: salesItemId },
      ShoppingCart,
      ShoppingCartOrOrderSalesItem,
      {
        preHooks: {
          isSuccessfulOrTrue: async () => {
            const [currentSalesItem] = await this.salesItemService.getSalesItem({ _id: salesItemId });
            return currentSalesItem?.state === 'forSale';
          },
          errorMessage: SALES_ITEM_ALREADY_SOLD
        }
      }
    );
  }

  @AllowForSelf()
  removeFromShoppingCart({ _id, salesItemId }: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'salesItems', salesItemId, ShoppingCart, {
      preHooks: () => this.salesItemService.updateSalesItemState({ _id: salesItemId, newState: 'forSale' })
    });
  }

  @AllowForSelf()
  getShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<ShoppingCart> {
    return this.dbManager.executeInsideTransaction(async () => {
      const [shoppingCart, error] = await this.dbManager.getEntityWhere(
        'userAccountId',
        userAccountId,
        ShoppingCart
      );

      if (error?.statusCode === HttpStatusCodes.NOT_FOUND) {
        return this.dbManager.createEntity({ userAccountId, salesItems: [] }, ShoppingCart);
      }

      return [shoppingCart, error];
    });
  }

  @AllowForSelf()
  @Delete()
  @NoAutoTest()
  emptyShoppingCart({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<null> {
    return this.deleteShoppingCart({ _id });
  }

  @AllowForServiceInternalUse()
  deleteShoppingCart({ _id }: _Id): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, ShoppingCart);
  }
}
