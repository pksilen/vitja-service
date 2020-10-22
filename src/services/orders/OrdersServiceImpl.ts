import { Injectable } from '@nestjs/common';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import AllowServiceForUserRoles from '../../backk/annotations/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/annotations/service/function/AllowForSelf';
import { AllowForUserRoles } from '../../backk/annotations/service/function/AllowForUserRoles';
import { NoCaptcha } from '../../backk/annotations/service/function/NoCaptcha';
import SalesItemsService from '../salesitems/SalesItemsService';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import OrdersService from './OrdersService';
import CreateOrderArg from './types/args/CreateOrderArg';
import DeliverOrderItemArg from './types/args/DeliverOrderItemArg';
import Order from './types/entity/Order';
import OrderItem from './types/entity/OrderItem';
import { AllowForTests } from '../../backk/annotations/service/function/AllowForTests';
import DeleteOrderItemArg from './types/args/DeleteOrderItemArg';
import AddOrderItemArg from './types/args/AddOrderItemArg';
import UpdateOrderItemStateArg from './types/args/UpdateOrderItemStateArg';
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import IdAndUserId from "../../backk/types/IdAndUserId";

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
  async createOrder({ salesItemIds, ...restOfArg }: CreateOrderArg): Promise<Order | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      const possibleErrorResponse = await this.updateSalesItemStatesToSold(salesItemIds);

      return possibleErrorResponse
        ? possibleErrorResponse
        : await this.dbManager.createItem(
            {
              ...restOfArg,
              createdTimestampInSecs: Math.round(Date.now() / 1000),
              orderItems: salesItemIds.map((salesItemId, index) => ({
                id: index.toString(),
                salesItemId,
                state: 'toBeDelivered',
                trackingUrl: '',
                deliveryTimestampInSecs: 0
              }))
            },
            Order,
            this.Types
          );
    });
  }

  @AllowForSelf()
  deleteOrderItem({ orderId, orderItemId }: DeleteOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.deleteSubItems(
      orderId,
      `orderItems[?(@.id == '${orderItemId}')]`,
      Order,
      this.Types,
      {
        [`orderItems[?(@.id == '${orderItemId}')].state`]: 'toBeDelivered'
      }
    );
  }

  @AllowForTests()
  addOrderItem({ orderId, salesItemId }: AddOrderItemArg): Promise<Order | ErrorResponse> {
    return this.dbManager.createSubItem(
      orderId,
      'orderItems',
      {
        salesItemId,
        state: 'toBeDelivered',
        trackingUrl: '',
        deliveryTimestampInSecs: 0
      },
      Order,
      OrderItem,
      this.Types
    );
  }

  @AllowForSelf()
  getOrdersByUserId({ userId, ...postQueryOps }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy('userId', userId, Order, this.Types, postQueryOps);
  }

  @AllowForSelf()
  getOrderById({ _id }: IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getItemById(_id, Order, this.Types);
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  deliverOrderItem({
    orderId,
    orderItemId,
    ...restOfArg
  }: DeliverOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(
      {
        _id: orderId,
        orderItems: [{ state: 'delivering' as 'delivering', id: orderItemId, ...restOfArg }]
      },
      Order,
      this.Types,
      {
        [`orderItems[?(@.id == '${orderItemId}')].state`]: 'toBeDelivered'
      }
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  updateOrderItemState({
    orderId,
    orderItemId,
    newState
  }: UpdateOrderItemStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      if (newState === 'returned') {
        const possibleErrorResponse = this.updateOrderItemSalesItemStateToForSale(orderId, orderItemId);
        if (possibleErrorResponse) {
          return possibleErrorResponse;
        }
      }

      return this.dbManager.updateItem(
        { _id: orderId, orderItems: [{ id: orderItemId, state: newState }] },
        Order,
        this.Types,
        {
          [`orderItems[?(@.id == '${orderItemId}')].state`]: OrdersServiceImpl.getPreviousStateFor(newState)
        }
      );
    });
  }

  deleteOrderById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, Order);
  }

  private async updateSalesItemStatesToSold(salesItemIds: string[]): Promise<void | ErrorResponse> {
    return await salesItemIds.reduce(
      async (errorResponseAccumulator: Promise<void | ErrorResponse>, salesItemId) => {
        return (
          (await errorResponseAccumulator) ||
          (await this.salesItemsService.updateSalesItemState(
            {
              _id: salesItemId,
              state: 'sold'
            },
            'forSale'
          ))
        );
      },
      Promise.resolve(undefined)
    );
  }

  private async updateOrderItemSalesItemStateToForSale(
    orderId: string,
    orderItemId: string
  ): Promise<void | ErrorResponse> {
    const orderItemOrErrorResponse = await this.dbManager.getSubItem<Order, OrderItem>(
      orderId,
      `orderItems[?(@.id == '${orderItemId}')]`,
      Order,
      this.Types
    );

    if ('errorMessage' in orderItemOrErrorResponse) {
      return orderItemOrErrorResponse;
    }

    return await this.salesItemsService.updateSalesItemState(
      {
        _id: orderItemOrErrorResponse.salesItemId,
        state: 'forSale'
      },
      'sold'
    );
  }

  private static getPreviousStateFor(
    newState: 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned'
  ): 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned' {
    switch (newState) {
      case 'delivered':
        return 'delivering';
      case 'returning':
        return 'delivered';
      case 'returned':
        return 'returning';
      default:
        return newState;
    }
  }
}
