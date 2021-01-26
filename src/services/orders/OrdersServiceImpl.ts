import { Injectable } from '@nestjs/common';
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
import Order from './types/entities/Order';
import OrderItem from './types/entities/OrderItem';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import DeleteOrderItemArg from './types/args/DeleteOrderItemArg';
import AddOrderItemArg from './types/args/AddOrderItemArg';
import UpdateOrderItemStateArg from './types/args/UpdateOrderItemStateArg';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import _IdAndUserId from '../../backk/types/id/_IdAndUserId';
import {
  DELETE_ORDER_NOT_ALLOWED,
  INVALID_ORDER_ITEM_STATE,
  ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
} from './errors/ordersServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import executeForAll from '../../backk/utils/executeForAll';
import ShoppingCartService from '../shoppingcart/ShoppingCartService';
import { SalesItemState } from '../salesitems/types/enums/SalesItemState';
import { OrderState } from './types/enum/OrderState';
import { Update } from '../../backk/decorators/service/function/Update';
import sendToRemoteService from '../../backk/remote/messagequeue/sendToRemoteService';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrdersServiceImpl extends OrdersService {
  constructor(
    dbManager: AbstractDbManager,
    private readonly salesItemsService: SalesItemsService,
    private readonly shoppingCartService: ShoppingCartService
  ) {
    super(dbManager);
  }

  @AllowForTests()
  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(Order);
  }

  @AllowForSelf()
  @NoCaptcha()
  async createOrder({
    userId,
    shoppingCartId,
    salesItemIds,
    paymentInfo
  }: CreateOrderArg): Promise<Order | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      const createdOrderOrErrorResponse = await this.dbManager.createEntity(
        {
          userId,
          orderItems: salesItemIds.map((salesItemId, index) => ({
            id: index.toString(),
            salesItemId,
            state: 'toBeDelivered' as OrderState,
            trackingUrl: null,
            deliveryTimestamp: null
          })),
          paymentInfo
        },
        Order,
        {
          isTrueOrSuccessful: async () =>
            (await this.updateSalesItemStates(salesItemIds, 'sold', 'forSale')) ||
            (await this.shoppingCartService.deleteShoppingCartById({ _id: shoppingCartId, userId }))
        }
      );

      let possibleErrorResponse: void | ErrorResponse;
      if (!('errorMessage' in createdOrderOrErrorResponse)) {
        possibleErrorResponse = await sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderCreateNotifications`,
          {
            userId,
            salesItemIds
          }
        );
      }

      return possibleErrorResponse || createdOrderOrErrorResponse;
    });
  }

  @AllowForSelf()
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
  deleteOrderItem({ orderId, orderItemId }: DeleteOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(
      async () =>
        (await this.dbManager.removeSubEntityById(orderId, 'orderItems', orderItemId, Order, {
          currentEntityJsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
          isTrueOrSuccessful: ([state]) => state === 'toBeDelivered',
          error: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
        })) ||
        (await sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/refund-service.vitja/refundService.refundOrderItem`,
          {
            orderId,
            orderItemId
          }
        ))
    );
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
        deliveryTimestamp: null
      },
      Order,
      OrderItem
    );
  }

  @AllowForSelf()
  getOrdersByUserId({ userId, ...postQueryOperations }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getEntitiesWhere('userId', userId, Order, postQueryOperations);
  }

  @AllowForSelf()
  getOrderById({ _id }: _IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @Update()
  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
  async deliverOrderItem({
    orderId,
    orderItemId,
    ...restOfArg
  }: DeliverOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(
      async () =>
        (await this.dbManager.updateEntity(
          {
            _id: orderId,
            orderItems: [{ state: 'delivering', id: orderItemId, ...restOfArg }]
          },
          Order,
          [],
          {
            currentEntityJsonPath: `orderItems[?(@.id == '${orderItemId}')].state`,
            isTrueOrSuccessful: ([state]) => state === 'toBeDelivered',
            error: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
          }
        )) ||
        (await sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderItemDeliveryNotification`,
          {
            orderId,
            orderItemId,
            ...restOfArg
          }
        ))
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([INVALID_ORDER_ITEM_STATE])
  async updateOrderItemState({
    orderId,
    orderItemId,
    newState
  }: UpdateOrderItemStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      let possibleErrorResponse = await this.dbManager.updateEntity(
        { _id: orderId, orderItems: [{ id: orderItemId, state: newState }] },
        Order,
        [],
        {
          currentEntityJsonPath: `orderItems[?(@.id == '${orderItemId}')]`,
          isTrueOrSuccessful: async ([{ salesItemId, state }]) =>
            (newState === 'returned'
              ? await this.salesItemsService.updateSalesItemState(
                  {
                    _id: salesItemId,
                    newState: 'forSale'
                  },
                  'sold'
                )
              : false) || state === OrdersServiceImpl.getPreviousOrderStateFor(newState),
          error: INVALID_ORDER_ITEM_STATE
        }
      );

      if (newState === 'returned') {
        possibleErrorResponse = await sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/refund-service.vitja/refundService.refundOrderItem`,
          {
            orderId,
            orderItemId
          }
        );
      }

      return possibleErrorResponse;
    });
  }

  @AllowForSelf()
  deleteOrderById({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, Order, [
      {
        currentEntityJsonPath: 'orderItems[?(@.state != "toBeDelivered")]',
        isTrueOrSuccessful: (orderItemsInDelivery) => orderItemsInDelivery.length === 0,
        error: DELETE_ORDER_NOT_ALLOWED,
        disregardInTests: true
      },
      {
        currentEntityJsonPath: 'orderItems[*].salesItemId',
        isTrueOrSuccessful: async (salesItemIds) => await this.updateSalesItemStates(salesItemIds, 'forSale')
      }
    ]);
  }

  private async updateSalesItemStates(
    salesItemIds: string[],
    newState: SalesItemState,
    currentState?: SalesItemState
  ): Promise<void | ErrorResponse> {
    return await executeForAll(
      salesItemIds,
      async (salesItemId) =>
        await this.salesItemsService.updateSalesItemState(
          {
            _id: salesItemId,
            newState
          },
          currentState
        )
    );
  }

  private static getPreviousOrderStateFor(newState: OrderState): OrderState {
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
