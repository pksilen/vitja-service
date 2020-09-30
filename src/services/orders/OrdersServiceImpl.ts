import { Injectable } from "@nestjs/common";
import { ErrorResponse, Id, IdAndUserId } from "../../backk/Backk";
import OrdersService from "./OrdersService";
import Order from "./types/entity/Order";
import CreateOrderArg from "./types/args/CreateOrderArg";
import AbstractDbManager from "src/backk/dbmanager/AbstractDbManager";
import UpdateOrderArg from "./types/args/UpdateOrderArg";
import SalesItemsService from "../salesitems/SalesItemsService";
import GetByUserIdArg from "../users/types/args/GetByUserIdArg";
import { NoCaptcha } from "../../backk/annotations/service/function/NoCaptcha";
import AllowServiceForUserRoles from "../../backk/annotations/service/AllowServiceForUserRoles";
import { AllowForSelf } from "../../backk/annotations/service/function/AllowForSelf";
import UpdateOrderDeliveryStateArg from "./types/args/UpdateOrderDeliveryStateArg";
import { AllowForUserRoles } from "../../backk/annotations/service/function/AllowForUserRoles";
import DeliverOrderArg from "./types/args/DeliverOrderArg";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrdersServiceImpl extends OrdersService {
  constructor(dbManager: AbstractDbManager, private readonly salesItemsService: SalesItemsService) {
    super(dbManager);
  }

  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(Order);
  }

  @AllowForSelf()
  @NoCaptcha()
  async createOrder(arg: CreateOrderArg): Promise<Id | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      const errorResponse = await this.updateSalesItemStatesToSold(arg);

      return errorResponse
        ? errorResponse
        : await this.dbManager.createItem(
            {
              ...arg,
              createdTimestampInSecs: Math.round(Date.now() / 1000),
              state: 'toBeDelivered',
              trackingUrl: 'abc',
              deliveryTimestampInSecs: 123
            },
            Order,
            this.Types
          );
    });
  }

  @AllowForSelf()
  getOrdersByUserId({ userId, ...postQueryOps }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy('userId', userId, Order, this.Types, postQueryOps);
  }

  @AllowForSelf()
  getOrderById({ _id }: IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getItemById(_id, Order, this.Types);
  }

  @AllowForSelf()
  updateOrder(arg: UpdateOrderArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(arg, Order, this.Types);
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  deliverOrder(arg: DeliverOrderArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem({ ...arg, state: 'delivered' }, Order, this.Types);
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  updateOrderDeliveryState(arg: UpdateOrderDeliveryStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(arg, Order, this.Types);
  }

  @AllowForSelf()
  deleteOrderById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, Order);
  }

  private async updateSalesItemStatesToSold(createOrderArg: CreateOrderArg): Promise<void | ErrorResponse> {
    return await createOrderArg.shoppingCartItems.reduce(
      async (errorResponseAccumulator: Promise<void | ErrorResponse>, shoppingCartItem) => {
        return (
          (await errorResponseAccumulator) ||
          (await this.salesItemsService.updateSalesItemState(
            {
              _id: shoppingCartItem.salesItemId,
              state: 'sold'
            },
            'forSale'
          ))
        );
      },
      Promise.resolve(undefined)
    );
  }
}
