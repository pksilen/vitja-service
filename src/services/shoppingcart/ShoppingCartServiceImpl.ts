import { Injectable } from "@nestjs/common";
import ShoppingCartService from "./ShoppingCartService";
import { ErrorResponse, Id } from "../../backk/Backk";
import CreateShoppingCartArg from "./types/args/CreateShoppingCartArg";
import ShoppingCart from "./types/entities/ShoppingCart";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserId from "../users/types/args/UserId";

@Injectable()
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(ShoppingCart);
  }

  createShoppingCart(arg: CreateShoppingCartArg): Promise<Id | ErrorResponse> {
    return this.dbManager.createItem(arg, ShoppingCart, this.Types);
  }

  getShoppingCartByUserId({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getItemBy('userId', userId, ShoppingCart, this.Types);
  }

  updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(shoppingCart, ShoppingCart, this.Types);
  }

  deleteShoppingCartById({ _id }: Id): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, ShoppingCart);
  }
}
