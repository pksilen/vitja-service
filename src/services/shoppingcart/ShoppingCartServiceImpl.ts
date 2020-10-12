import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/annotations/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/annotations/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/annotations/service/function/NoCaptcha';
import { ErrorResponse, IdAndUserId } from '../../backk/Backk';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserId from '../users/types/args/UserId';
import ShoppingCartService from './ShoppingCartService';
import CreateShoppingCartArg from './types/args/CreateShoppingCartArg';
import ShoppingCart from './types/entities/ShoppingCart';

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
  async createShoppingCart(arg: CreateShoppingCartArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.createItem(arg, ShoppingCart, this.Types, 1, { userId: arg.userId });
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
