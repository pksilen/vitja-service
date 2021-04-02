import { Injectable } from "@nestjs/common";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import ShoppingCartService from "./ShoppingCartService";
import ShoppingCart from "./types/entities/ShoppingCart";
import SalesItemService from "../salesitem/SalesItemService";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { Delete } from "../../backk/decorators/service/function/Delete";
import { AllowForServiceInternalUse } from "../../backk/decorators/service/function/AllowForServiceInternalUse";
import ShoppingCartOrOrderSalesItem from "./types/entities/ShoppingCartOrOrderSalesItem";
import UserAccountIdAndSalesItemId from "./types/args/UserAccountIdAndSalesItemId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import { Update } from "../../backk/decorators/service/function/Update";
import { shoppingCartServiceErrors } from "./errors/shoppingCartServiceErrors";
import UserAccountId from "../../backk/types/useraccount/UserAccountId";
import { ErrorDef } from "../../backk/dbmanager/hooks/PreHook";
import { HttpStatusCodes } from "../../backk/constants/constants";

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

  @AllowForSelf()
  async getShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<ShoppingCart> {
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
  @Update('addOrRemove')
  addToShoppingCart({ userAccountId, salesItemId }: UserAccountIdAndSalesItemId): PromiseOfErrorOr<null> {
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
                    ['forSale'],
                    userAccountId
                  ),
                error: shoppingCartServiceErrors.salesItemReservedOrSold
              }
            }
          )
        : [null, error];
    });
  }

  @AllowForServiceInternalUse()
  getShoppingCartOrErrorIfEmpty(userAccountId: string, error: ErrorDef): PromiseOfErrorOr<ShoppingCart> {
    return this.dbManager.getEntityWhere('userAccountId', userAccountId, ShoppingCart, {
      postHook: {
        isSuccessfulOrTrue: (shoppingCart) => (shoppingCart?.salesItems.length ?? 0) > 0,
        error
      }
    });
  }

  @AllowForSelf()
  @Update('addOrRemove')
  removeFromShoppingCart({
    userAccountId,
    salesItemId
  }: UserAccountIdAndSalesItemId): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityByIdWhere(
      'userAccountId',
      userAccountId,
      'salesItems',
      salesItemId,
      ShoppingCart,
      {
        preHooks: () =>
          this.salesItemService.updateSalesItemState(salesItemId, 'forSale', ['reserved'], userAccountId)
      }
    );
  }

  @AllowForSelf()
  @Delete()
  emptyShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityWhere('userAccountId', userAccountId, ShoppingCart, {
      preHooks: ({ salesItems }) =>
        this.salesItemService.updateSalesItemStates(salesItems, 'forSale', ['reserved'], userAccountId)
    });
  }

  @AllowForServiceInternalUse()
  deleteShoppingCart({ userAccountId }: UserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityWhere('userAccountId', userAccountId, ShoppingCart);
  }
}
