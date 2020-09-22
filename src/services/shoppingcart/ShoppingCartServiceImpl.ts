import { Injectable } from "@nestjs/common";
import ShoppingCartService from "./ShoppingCartService";
import { ErrorResponse, IdWrapper } from "../../backk/Backk";
import ShoppingCartCreateDto from "./types/ShoppingCartCreateDto";
import ShoppingCart from "./types/ShoppingCart";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import UserIdWrapper from "../users/types/UserIdWrapper";

@Injectable()
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(ShoppingCart);
  }

  createShoppingCart(shoppingCartCreateDto: ShoppingCartCreateDto): Promise<IdWrapper | ErrorResponse> {
    return this.dbManager.createItem(shoppingCartCreateDto, ShoppingCart, this.Types);
  }

  getShoppingCartByUserId({ userId }: UserIdWrapper): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getItemBy('userId', userId, ShoppingCart, this.Types);
  }

  updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(shoppingCart, ShoppingCart, this.Types);
  }

  deleteShoppingCartById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, ShoppingCart);
  }
}
