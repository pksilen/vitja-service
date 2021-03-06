import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import ShoppingCartService from './ShoppingCartService';
import ShoppingCart from './types/entities/ShoppingCart';
import SalesItemService from '../salesitem/SalesItemService';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { Delete } from '../../backk/decorators/service/function/Delete';
import { AllowForServiceInternalUse } from '../../backk/decorators/service/function/AllowForServiceInternalUse';
import UserAccountIdAndSalesItemId from './types/args/UserAccountIdAndSalesItemId';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import { Update } from '../../backk/decorators/service/function/Update';
import { shoppingCartServiceErrors } from './errors/shoppingCartServiceErrors';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { ErrorDef } from '../../backk/dbmanager/hooks/PreHook';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager, private readonly salesItemService: SalesItemService) {
    super(shoppingCartServiceErrors, dbManager);
  }

  @AllowForTests()
  deleteAllShoppingCarts(): PromiseErrorOr<null> {
    return this.dbManager.deleteAllEntities(ShoppingCart);
  }

  @AllowForSelf()
  getShoppingCart({ userAccountId }: UserAccountId): PromiseErrorOr<ShoppingCart> {
    return this.dbManager.getEntityByFilters(
      ShoppingCart,
      { userAccountId },
      {
        preHooks: () => this.removeExpiredSalesItemsFromShoppingCart(userAccountId),
        ifEntityNotFoundReturn: () =>
          this.dbManager.createEntity(ShoppingCart, { userAccountId, salesItems: [] })
      }
    );
  }

  @AllowForSelf()
  @Update('addOrRemove')
  addToShoppingCart({ userAccountId, salesItemId }: UserAccountIdAndSalesItemId): PromiseErrorOr<null> {
    return this.dbManager.addSubEntityToEntityByFilters(
      'salesItems',
      { _id: salesItemId },
      ShoppingCart,
      { userAccountId },
      {
        ifEntityNotFoundUse: () =>
          this.dbManager.createEntity(ShoppingCart, { userAccountId, salesItems: [] }),
        entityPreHooks: {
          shouldSucceedOrBeTrue: () =>
            this.salesItemService.updateSalesItemState(salesItemId, 'reserved', 'forSale', userAccountId),
          error: shoppingCartServiceErrors.salesItemReservedOrSold
        }
      }
    );
  }

  @AllowForSelf()
  @Update('addOrRemove')
  removeFromShoppingCart({ userAccountId, salesItemId }: UserAccountIdAndSalesItemId): PromiseErrorOr<null> {
    return this.dbManager.removeSubEntityByIdFromEntityByFilters(
      'salesItems',
      salesItemId,
      ShoppingCart,
      { userAccountId },
      {
        entityPreHooks: () =>
          this.salesItemService.updateSalesItemStatesByFilters(
            [salesItemId],
            'forSale',
            'reserved',
            userAccountId
          )
      }
    );
  }

  @AllowForSelf()
  @Delete()
  emptyShoppingCart({ userAccountId }: UserAccountId): PromiseErrorOr<null> {
    return this.dbManager.deleteEntityByFilters(
      ShoppingCart,
      { userAccountId },
      {
        entityPreHooks: ({ salesItems }) =>
          this.salesItemService.updateSalesItemStatesByFilters(
            salesItems.map(({ _id }) => _id),
            'forSale',
            'reserved',
            userAccountId
          )
      }
    );
  }

  @AllowForServiceInternalUse()
  deleteShoppingCart({ userAccountId }: UserAccountId): PromiseErrorOr<null> {
    return this.dbManager.deleteEntitiesByFilters(ShoppingCart, { userAccountId });
  }

  @AllowForServiceInternalUse()
  getShoppingCartOrErrorIfEmpty(userAccountId: string, error: ErrorDef): PromiseErrorOr<ShoppingCart> {
    return this.dbManager.getEntityByFilters(
      ShoppingCart,
      { userAccountId },
      {
        preHooks: () => this.removeExpiredSalesItemsFromShoppingCart(userAccountId),
        postHook: {
          shouldSucceedOrBeTrue: (shoppingCart) => (shoppingCart?.salesItems.length ?? 0) > 0,
          error
        }
      }
    );
  }

  private removeExpiredSalesItemsFromShoppingCart(userAccountId: string): PromiseErrorOr<null> {
    return this.dbManager.removeSubEntitiesByJsonPathFromEntityByFilters(
      `salesItems[?(@.state !== 'reserved' || @.buyerUserAccountId !== '${userAccountId}' )]`,
      ShoppingCart,
      { userAccountId }
    );
  }
}
