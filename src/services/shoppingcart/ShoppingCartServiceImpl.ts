import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import ShoppingCartService from './ShoppingCartService';
import ShoppingCart from './types/entities/ShoppingCart';
import SalesItemService from '../salesitem/SalesItemService';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { Delete } from '../../backk/decorators/service/function/Delete';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import ShoppingCartOrOrderSalesItem from './types/entities/ShoppingCartOrOrderSalesItem';
import _IdAndUserAccountIdAndSalesItemId from './types/args/_IdAndUserAccountIdAndSalesItemId';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';
import { Update } from '../../backk/decorators/service/function/Update';
import { PostTests } from '../../backk/decorators/service/function/PostTests';
import { shoppingCartServiceErrors } from './errors/shoppingCartServiceErrors';
import { TestSetup } from '../../backk/decorators/service/function/TestSetup';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { ErrorDef } from '../../backk/dbmanager/hooks/PreHook';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager, private readonly salesItemService: SalesItemService) {
    super(shoppingCartServiceErrors, dbManager);
  }

  @AllowForTests()
  deleteAllShoppingCarts(): PromiseOfErrorOr<null> {
    return this.dbManager.deleteAllEntities(ShoppingCart);
  }

  @NoCaptcha()
  @AllowForSelf()
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
        error: shoppingCartServiceErrors.shoppingCartAlreadyExists
      }
    });
  }

  @AllowForSelf()
  getShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<ShoppingCart> {
    return this.dbManager.getEntityWhere('userAccountId', userAccountId, ShoppingCart);
  }

  @AllowForServiceInternalUse()
  getShoppingCartOrErrorIfEmpty(userAccountId: string, error: ErrorDef): PromiseOfErrorOr<ShoppingCart> {
    return this.dbManager.getEntityWhere('userAccountId', userAccountId, ShoppingCart, {
      postHook: {
        isSuccessful: (shoppingCart) => (shoppingCart?.salesItems.length ?? 0) > 0,
        error
      }
    });
  }

  @AllowForSelf()
  @Update('addOrRemoveSubEntities')
  @TestSetup(['salesItemService.createSalesItem'])
  @PostTests([
    {
      testName: 'expect shopping cart to contain a sales item',
      serviceFunctionName: 'shoppingCartService.getShoppingCart',
      expectedResult: {
        'salesItems._id': '{{salesItemId}}'
      }
    },
    {
      testName: 'expect sales item to be in reserved state',
      serviceFunctionName: 'salesItemService.getSalesItem',
      expectedResult: {
        state: 'reserved'
      }
    }
  ])
  addToShoppingCart({
    _id,
    userAccountId,
    salesItemId
  }: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.addSubEntity(
      _id,
      'salesItems',
      { _id: salesItemId },
      ShoppingCart,
      ShoppingCartOrOrderSalesItem,
      {
        preHooks: {
          isSuccessfulOrTrue: () =>
            this.salesItemService.updateSalesItemState(salesItemId, 'reserved', 'forSale', userAccountId),
          error: shoppingCartServiceErrors.salesItemReservedOrSold
        }
      }
    );
  }

  @AllowForSelf()
  @Update('addOrRemoveSubEntities')
  @PostTests([
    {
      testName: 'expect empty shopping cart',
      serviceFunctionName: 'shoppingCartService.getShoppingCart',
      expectedResult: { salesItems: [] }
    },
    {
      testName: 'expect sales item to be for sale',
      serviceFunctionName: 'salesItemService.getSalesItem',
      expectedResult: {
        state: 'forSale'
      }
    }
  ])
  removeFromShoppingCart({
    _id,
    userAccountId,
    salesItemId
  }: _IdAndUserAccountIdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'salesItems', salesItemId, ShoppingCart, {
      preHooks: () =>
        this.salesItemService.updateSalesItemState(salesItemId, 'forSale', 'reserved', userAccountId)
    });
  }

  @AllowForSelf()
  @Delete()
  emptyShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityWhere('userAccountId', userAccountId, ShoppingCart, {
      preHooks: ({ salesItems }) =>
        this.salesItemService.updateSalesItemStates(salesItems, 'forSale', 'reserved', userAccountId)
    });
  }

  @AllowForServiceInternalUse()
  deleteShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityWhere('userAccountId', userAccountId, ShoppingCart);
  }
}
