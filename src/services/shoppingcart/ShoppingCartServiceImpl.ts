import { Injectable } from "@nestjs/common";
import AllowServiceForUserRoles from "../../backk/decorators/service/AllowServiceForUserRoles";
import { AllowForSelf } from "../../backk/decorators/service/function/AllowForSelf";
import { NoCaptcha } from "../../backk/decorators/service/function/NoCaptcha";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserId from "../users/types/args/UserId";
import ShoppingCartService from "./ShoppingCartService";
import ShoppingCart from "./types/entities/ShoppingCart";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import _IdAndUserId from "../../backk/types/id/_IdAndUserId";
import awaitDbOperationAndGetResultOfPredicate from "../../backk/utils/getErrorResponseOrResultOf";
import ShoppingCartItem from "./types/entities/ShoppingCartItem";
import { SHOPPING_CART_ALREADY_EXISTS } from "./errors/shoppingCartServiceErrors";
import { Errors } from "../../backk/decorators/service/function/Errors";
import AddShoppingCartItemArg from "./types/args/AddShoppingCartItemArg";
import RemoveShoppingCartItemArg from "./types/args/RemoveShoppingCartItemArg";
import { SALES_ITEM_STATE_MUST_BE_FOR_SALE } from "../salesitems/errors/salesItemsServiceErrors";
import SalesItemsService from "../salesitems/SalesItemsService";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { ExpectReturnValueToContainInTests } from "../../backk/decorators/service/function/ExpectReturnValueToContainInTests";

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
  @ExpectReturnValueToContainInTests({shoppingCartItems: []})
  removeShoppingCartItem({
    shoppingCartId,
    shoppingCartItemId
  }: RemoveShoppingCartItemArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.removeSubEntityById(
      shoppingCartId,
      'shoppingCartItems',
      shoppingCartItemId,
      ShoppingCart,
      {
        entityJsonPathForPreHookFuncArg: `shoppingCartItems[?(@.id == '${shoppingCartItemId}')]`,
        preHookFunc: ([{ salesItemId }]) =>
          this.salesItemService.updateSalesItemState({ _id: salesItemId, newState: 'forSale' })
      }
    );
  }

  @AllowForSelf()
  addShoppingCartItem({
    shoppingCartId,
    salesItemId,
    version
  }: AddShoppingCartItemArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.addSubEntity(
      shoppingCartId,
      version,
      'shoppingCartItems',
      { salesItemId },
      ShoppingCart,
      ShoppingCartItem,
      {
        preHookFunc: () =>
          awaitDbOperationAndGetResultOfPredicate(
            this.salesItemService.getSalesItemById({ _id: salesItemId }),
            (salesItem) => salesItem.state === 'forSale'
          ),
        errorMessageOnPreHookFuncExecFailure: SALES_ITEM_STATE_MUST_BE_FOR_SALE
      }
    );
  }

  @AllowForSelf()
  getShoppingCartByUserId({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getEntityWhere('userId', userId, ShoppingCart);
  }

  @AllowForSelf()
  deleteShoppingCartById({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, ShoppingCart);
  }
}
