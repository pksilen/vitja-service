import { Injectable } from '@nestjs/common';
import { ErrorResponse, Id } from '../../backk/Backk';
import OrdersService from './OrdersService';
import Order from './types/entity/Order';
import CreateOrderArg from './types/args/CreateOrderArg';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import UpdateOrderArg from './types/args/UpdateOrderArg';
import UpdateOrderStateArg from './types/args/UpdateOrderStateArg';
import SalesItemsService from '../salesitems/SalesItemsService';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import { NoCaptcha } from "../../backk/annotations/service/function/NoCaptcha";

@Injectable()
export default class OrdersServiceImpl extends OrdersService {
  constructor(dbManager: AbstractDbManager, private readonly salesItemsService: SalesItemsService) {
    super(dbManager);
  }

  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(Order);
  }

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
              state: 'toBeDelivered'
            },
            Order,
            this.Types
          );
    });
  }

  getOrdersByUserId({ userId, ...postQueryOps }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy('userId', userId, Order, this.Types, postQueryOps);
  }

  getOrderById({ _id }: Id): Promise<Order | ErrorResponse> {
    return this.dbManager.getItemById(_id, Order, this.Types);
  }

  updateOrder(arg: UpdateOrderArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(arg, Order, this.Types);
  }

  updateOrderState(arg: UpdateOrderStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(arg, Order, this.Types);
  }

  deleteOrderById({ _id }: Id): Promise<void | ErrorResponse> {
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
