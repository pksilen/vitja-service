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
import ShoppingCartOrOrderSalesItem from './types/entities/ShoppingCartOrOrderSalesItem';
import UserAccountIdAndSalesItemId from './types/args/UserAccountIdAndSalesItemId';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import { Update } from '../../backk/decorators/service/function/Update';
import { shoppingCartServiceErrors } from './errors/shoppingCartServiceErrors';
import UserAccountId from '../../backk/types/useraccount/UserAccountId';
import { ErrorDef } from '../../backk/dbmanager/hooks/PreHook';
import { HttpStatusCodes } from '../../backk/constants/constants';

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
  async getShoppingCart({ userAccountId }: UserAccountId): PromiseErrorOr<ShoppingCart> {
    return this.dbManager.executeInsideTransaction(async () => {
      const [, removeError] = await this.removeExpiredSalesItemsFromShoppingCart(userAccountId);
      const [shoppingCart, error] = await this.dbManager.getEntityWhere(
        'userAccountId',
        userAccountId,
        ShoppingCart
      );

      if (error?.statusCode === HttpStatusCodes.NOT_FOUND) {
        return this.dbManager.createEntity({ userAccountId, salesItems: [] }, ShoppingCart);
      }

      return [shoppingCart, removeError ?? error];
    });
  }

  @AllowForSelf()
  @Update('addOrRemove')
  addToShoppingCart({ userAccountId, salesItemId }: UserAccountIdAndSalesItemId): PromiseErrorOr<null> {
    return this.dbManager.executeInsideTransaction(async () => {
      let [shoppingCart, error] = await this.dbManager.getEntityWhere(
        'userAccountId',
        userAccountId,
        ShoppingCart
      );

      if (error?.statusCode === HttpStatusCodes.NOT_FOUND) {
        [shoppingCart, error] = await this.dbManager.createEntity(
          { userAccountId, salesItems: [] },
          ShoppingCart
        );
      }

      return shoppingCart
        ? this.dbManager.addSubEntity(
            shoppingCart._id,
            'salesItems',
            { _id: salesItemId },
            ShoppingCart,
            ShoppingCartOrOrderSalesItem,
            {
              preHooks: {
                isSuccessfulOrTrue: () =>
                  this.salesItemService.updateSalesItemState(
                    salesItemId,
                    'reserved',
                    'forSale',
                    userAccountId
                  ),
                error: shoppingCartServiceErrors.salesItemReservedOrSold
              }
            }
          )
        : [null, error];
    });
  }

  @AllowForSelf()
  @Update('addOrRemove')
  removeFromShoppingCart({
    userAccountId,
    salesItemId
  }: UserAccountIdAndSalesItemId): PromiseErrorOr<null> {
    return this.dbManager.removeSubEntityByIdWhere(
      'userAccountId',
      userAccountId,
      'salesItems',
      salesItemId,
      ShoppingCart,
      {
        preHooks: () =>
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
    return this.dbManager.deleteEntityWhere('userAccountId', userAccountId, ShoppingCart, {
      preHooks: ({ salesItems }) =>
        this.salesItemService.updateSalesItemStatesByFilters(
          salesItems.map(({ _id }) => _id),
          'forSale',
          'reserved',
          userAccountId
        )
    });
  }

  @AllowForServiceInternalUse()
  deleteShoppingCart({ userAccountId }: UserAccountId): PromiseErrorOr<null> {
    return this.dbManager.deleteEntityWhere('userAccountId', userAccountId, ShoppingCart);
  }

  @AllowForServiceInternalUse()
  getShoppingCartOrErrorIfEmpty(userAccountId: string, error: ErrorDef): PromiseErrorOr<ShoppingCart> {
    return this.dbManager.executeInsideTransaction(async () => {
      const [, removeError] = await this.removeExpiredSalesItemsFromShoppingCart(userAccountId);
      return removeError
        ? [null, removeError]
        : this.dbManager.getEntityWhere('userAccountId', userAccountId, ShoppingCart, {
            postHook: {
              isSuccessfulOrTrue: (shoppingCart) => (shoppingCart?.salesItems.length ?? 0) > 0,
              error
            }
          });
    });
  }

  private removeExpiredSalesItemsFromShoppingCart(userAccountId: string): PromiseErrorOr<null> {
    return this.dbManager.removeSubEntitiesWhere(
      'userAccountId',
      userAccountId,
      `salesItems[?(@.state !== 'reserved' || @.buyerUserAccountId !== '${userAccountId}' )]`,
      ShoppingCart
    );
  }
}
