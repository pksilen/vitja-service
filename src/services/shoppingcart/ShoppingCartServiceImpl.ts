import { Injectable, Optional } from "@nestjs/common";
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import UserId from '../users/types/args/UserId';
import ShoppingCartService from './ShoppingCartService';
import CreateShoppingCartArg from './types/args/CreateShoppingCartArg';
import ShoppingCart from './types/entities/ShoppingCart';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import IdAndUserId from '../../backk/types/id/IdAndUserId';
import executeAndGetErrorResponseOrResultOf from '../../backk/utils/executeAndGetErrorResponseOrResultOf';
import ShoppingCartItem from './types/entities/ShoppingCartItem';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class ShoppingCartServiceImpl extends ShoppingCartService {
  constructor(
    dbManager: AbstractDbManager,
    @Optional() readonly Types = {
      ShoppingCart,
      ShoppingCartItem,
      CreateShoppingCartArg,
      UserId
    }
  ) {
    super(dbManager, Types);
  }

  deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(ShoppingCart);
  }

  @NoCaptcha()
  @AllowForSelf()
  async createShoppingCart(arg: CreateShoppingCartArg): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.createEntity(arg, ShoppingCart, {
      hookFunc: async () =>
        executeAndGetErrorResponseOrResultOf(
          await this.dbManager.getEntitiesCount({ userId: arg.userId }, ShoppingCart),
          (shoppingCartCount) => shoppingCartCount === 0
        ),
      errorMessage: 'Shopping cart already exists. Only one shopping cart is allowed'
    });
  }

  @AllowForSelf()
  getShoppingCartByUserId({ userId }: UserId): Promise<ShoppingCart | ErrorResponse> {
    return this.dbManager.getEntityBy('userId', userId, ShoppingCart);
  }

  @AllowForSelf()
  updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(shoppingCart, ShoppingCart);
  }

  @AllowForSelf()
  deleteShoppingCartById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, ShoppingCart);
  }
}
