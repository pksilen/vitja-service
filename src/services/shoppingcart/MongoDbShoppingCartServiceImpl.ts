import { Injectable } from "@nestjs/common";
import ShoppingCartService from "./ShoppingCartService";
import { ErrorResponse, IdWrapper } from "../../backk/Backk";
import ShoppingCartWithoutId from "./types/ShoppingCartWithoutId";
import UserIdWrapper from "../users/types/UserIdWrapper";
import ShoppingCart from "./types/ShoppingCart";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";

@Injectable()
export default class MongoDbShoppingCartServiceImpl extends ShoppingCartService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  async deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return await this.dbManager.deleteAllItems(ShoppingCart);
  }

  async createShoppingCart(shoppingCartWithoutId: ShoppingCartWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await this.dbManager.createItem(shoppingCartWithoutId, ShoppingCart, this.Types);
  }

  async getShoppingCartByUserId({ userId }: UserIdWrapper): Promise<ShoppingCart | ErrorResponse> {
    return await this.dbManager.getItemBy('userId', userId, ShoppingCart, this.Types);
  }

  async updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    await this.dbManager.updateItem(shoppingCart, ShoppingCart, this.Types);
  }

  async deleteShoppingCartById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await this.dbManager.deleteItemById(_id, ShoppingCart);
  }
}
