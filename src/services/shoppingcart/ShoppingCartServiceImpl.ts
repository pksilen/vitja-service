import { Injectable } from "@nestjs/common";
import ShoppingCartService from "./ShoppingCartService";
import { ErrorResponse, IdWrapper } from "../../backk/Backk";
import ShoppingCartWithoutId from "./types/ShoppingCartWithoutId";
import ShoppingCart from "./types/ShoppingCart";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";

@Injectable()
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(ShoppingCart);
  }

  createShoppingCart(shoppingCartWithoutId: ShoppingCartWithoutId): Promise<IdWrapper | ErrorResponse> {
    return this.dbManager.createItem(shoppingCartWithoutId, ShoppingCart, this.Types);
  }

  getShoppingCartByUserId({ _id }: IdWrapper): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getItemBy('userId', _id, ShoppingCart, this.Types);
  }

  updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(shoppingCart, ShoppingCart, this.Types);
  }

  deleteShoppingCartById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, ShoppingCart);
  }
}
