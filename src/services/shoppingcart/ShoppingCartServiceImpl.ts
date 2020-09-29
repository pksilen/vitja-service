import { Injectable } from "@nestjs/common";
import ShoppingCartService from "./ShoppingCartService";
import { ErrorResponse, Id, IdAndUserId } from "../../backk/Backk";
import CreateShoppingCartArg from "./types/args/CreateShoppingCartArg";
import ShoppingCart from "./types/entities/ShoppingCart";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserId from "../users/types/args/UserId";
import { NoCaptcha } from "../../backk/annotations/service/function/NoCaptcha";
import AllowServiceForUserRoles from "../../backk/annotations/service/AllowServiceForUserRoles";
import { AllowForSelf } from "../../backk/annotations/service/function/AllowForSelf";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(ShoppingCart);
  }

  @NoCaptcha()
  @AllowForSelf()
  createShoppingCart(arg: CreateShoppingCartArg): Promise<Id | ErrorResponse> {
    return this.dbManager.createItem(arg, ShoppingCart, this.Types);
  }

  @AllowForSelf()
  getShoppingCartByUserId({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getItemBy('userId', userId, ShoppingCart, this.Types);
  }

  @AllowForSelf()
  updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(shoppingCart, ShoppingCart, this.Types);
  }

  @AllowForSelf()
  deleteShoppingCartById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, ShoppingCart);
  }
}
