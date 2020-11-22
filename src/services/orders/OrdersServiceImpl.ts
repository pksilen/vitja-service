import { Injectable, Optional } from '@nestjs/common';
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
import _IdAndUserId from '../../backk/types/id/_IdAndUserId';
import ShoppingCartItem from '../shoppingcart/types/entities/ShoppingCartItem';
import {
  DELETE_ORDER_NOT_ALLOWED,
  INVALID_ORDER_ITEM_STATE,
  ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
} from './errors/ordersServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import executeForAll from '../../backk/utils/executeForAll';
import ShoppingCartService from '../shoppingcart/ShoppingCartService';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrdersServiceImpl extends OrdersService {
  constructor(
    dbManager: AbstractDbManager,
    private readonly salesItemsService: SalesItemsService,
    private readonly shoppingCartService: ShoppingCartService,
    @Optional()
    readonly Types = {
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

  @AllowForTests()
  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(Order);
  }

  @AllowForSelf()
  @NoCaptcha()
  async createOrder({
    salesItemIds,
    shoppingCartId,
    userId
  }: CreateOrderArg): Promise<Order | ErrorResponse> {
    return await this.dbManager.createEntity(
      {
        userId,
        orderItems: salesItemIds.map((salesItemId, index) => ({
          id: index.toString(),
          salesItemId,
          state: 'toBeDelivered',
          trackingUrl: null,
          deliveryTimestampInSecs: 0
        }))
      },
      Order,

      {
        hookFunc: async () =>
          (await this.updateSalesItemStates(salesItemIds, 'sold', 'forSale')) ||
          (await this.shoppingCartService.deleteShoppingCartById({ _id: shoppingCartId, userId }))
      }
    );
  }

  @AllowForSelf()
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
  deleteOrderItem({ orderId, orderItemId }: DeleteOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.removeSubEntityById(orderId, 'orderItems', orderItemId, Order, {
      currentEntityJsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
      hookFunc: ([state]) => state === 'toBeDelivered',
      error: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
    });
  }

  @AllowForTests()
  addOrderItem({ orderId, salesItemId }: AddOrderItemArg): Promise<Order | ErrorResponse> {
    return this.dbManager.addSubEntity(
      orderId,
      'orderItems',
      {
        salesItemId,
        state: 'toBeDelivered',
        trackingUrl: null,
        deliveryTimestampInSecs: 0
      },
      Order,
      OrderItem
    );
  }

  @AllowForSelf()
  getOrdersByUserId({ userId, ...postQueryOperations }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getEntitiesBy('userId', userId, Order, postQueryOperations);
  }

  @AllowForSelf()
  getOrderById({ _id }: _IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
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
        currentEntityJsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
        hookFunc: ([state]) => state === 'toBeDelivered',
        error: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
      }
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([INVALID_ORDER_ITEM_STATE])
  async updateOrderItemState({
    orderId,
    orderItemId,
    newState
  }: UpdateOrderItemStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      { _id: orderId, orderItems: [{ id: orderItemId, state: newState }] },
      Order,
      {
        currentEntityJsonPath: `orderItems[?(@.id == '${orderItemId}')]`,
        hookFunc: async ([{ salesItemId, state }]) =>
          (newState === 'returned'
            ? await this.salesItemsService.updateSalesItemState(
                {
                  _id: salesItemId,
                  state: 'forSale'
                },
                'sold'
              )
            : false) || state === OrdersServiceImpl.getPreviousStateFor(newState),
        error: INVALID_ORDER_ITEM_STATE
      }
    );
  }

  @AllowForSelf()
  deleteOrderById({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, Order, [
      {
        currentEntityJsonPath: 'orderItems[?(@.state != "toBeDelivered")]',
        hookFunc: (orderItemsInDelivery) => orderItemsInDelivery.length === 0,
        error: DELETE_ORDER_NOT_ALLOWED,
        disregardInTests: true
      },
      {
        currentEntityJsonPath: 'orderItems[*].salesItemId',
        hookFunc: async (salesItemIds) => await this.updateSalesItemStates(salesItemIds, 'forSale')
      }
    ]);
  }

  private async updateSalesItemStates(
    salesItemIds: string[],
    newState: 'forSale' | 'sold',
    currentState?: 'forSale' | 'sold'
  ): Promise<void | ErrorResponse> {
    return await executeForAll(
      salesItemIds,
      async (salesItemId) =>
        await this.salesItemsService.updateSalesItemState(
          {
            _id: salesItemId,
            state: newState
          },
          currentState
        )
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
