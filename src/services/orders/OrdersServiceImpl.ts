import { Injectable, Optional } from "@nestjs/common";
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { AllowForUserRoles } from '../../backk/decorators/service/function/AllowForUserRoles';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import SalesItemsService from '../salesitems/SalesItemsService';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import OrdersService from './OrdersService';
import CreateOrderArg from './types/args/CreateOrderArg';
import DeliverOrderItemArg from './types/args/DeliverOrderItemArg';
import Order from './types/entity/Order';
import OrderItem from './types/entity/OrderItem';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import DeleteOrderItemArg from './types/args/DeleteOrderItemArg';
import AddOrderItemArg from './types/args/AddOrderItemArg';
import UpdateOrderItemStateArg from './types/args/UpdateOrderItemStateArg';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import IdAndUserId from '../../backk/types/id/IdAndUserId';
import ShoppingCartItem from '../shoppingcart/types/entities/ShoppingCartItem';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrdersServiceImpl extends OrdersService {
  constructor(
    dbManager: AbstractDbManager,
    private readonly salesItemsService: SalesItemsService,
    @Optional() readonly Types = {
      AddOrderItemArg,
      CreateOrderArg,
      DeleteOrderItemArg,
      DeliverOrderItemArg,
      GetByUserIdArg,
      Order,
      OrderItem,
      ShoppingCartItem,
      UpdateOrderItemStateArg
    }
  ) {
    super(dbManager, Types);
  }

  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(Order);
  }

  @AllowForSelf()
  @NoCaptcha()
  async createOrder({ salesItemIds, ...restOfArg }: CreateOrderArg): Promise<Order | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      const possibleErrorResponse = await this.updateSalesItemStatesToSold(salesItemIds);

      return possibleErrorResponse
        ? possibleErrorResponse
        : await this.dbManager.createEntity(
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
            Order
          );
    });
  }

  @AllowForSelf()
  deleteOrderItem({ orderId, orderItemId }: DeleteOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.deleteSubEntities(orderId, `orderItems[?(@.id == '${orderItemId}')]`, Order, {
      jsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
      hookFunc: (state) => state === 'toBeDelivered',
      errorMessage: 'order item state must be toBeDelivered'
    });
  }

  @AllowForTests()
  addOrderItem({ orderId, salesItemId }: AddOrderItemArg): Promise<Order | ErrorResponse> {
    return this.dbManager.createSubEntity(
      orderId,
      'orderItems',
      {
        salesItemId,
        state: 'toBeDelivered',
        trackingUrl: '',
        deliveryTimestampInSecs: 0
      },
      Order,
      OrderItem
    );
  }

  @AllowForSelf()
  getOrdersByUserId({ userId, _postQueryOperations }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getEntitiesBy('userId', userId, Order, _postQueryOperations);
  }

  @AllowForSelf()
  getOrderById({ _id }: IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  deliverOrderItem({
    orderId,
    orderItemId,
    ...restOfArg
  }: DeliverOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      {
        _id: orderId,
        orderItems: [{ state: 'delivering' as 'delivering', id: orderItemId, ...restOfArg }]
      },
      Order,
      {
        jsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
        hookFunc: (state) => state === 'toBeDelivered',
        errorMessage: 'order item state must be toBeDelivered'
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

      return this.dbManager.updateEntity(
        { _id: orderId, orderItems: [{ id: orderItemId, state: newState }] },
        Order,
        {
          jsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
          hookFunc: (state) => state === OrdersServiceImpl.getPreviousStateFor(newState),
          errorMessage: 'order item state must be ' + OrdersServiceImpl.getPreviousStateFor(newState)
        }
      );
    });
  }

  deleteOrderById({ _id }: IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, Order);
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
    const orderItemOrErrorResponse = await this.dbManager.getSubEntity<Order, OrderItem>(
      orderId,
      `orderItems[?(@.id == '${orderItemId}')]`,
      Order
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
