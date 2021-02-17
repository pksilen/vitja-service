import { Injectable } from '@nestjs/common';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { AllowForUserRoles } from '../../backk/decorators/service/function/AllowForUserRoles';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import SalesItemsService from '../salesitems/SalesItemsService';
import OrdersService from './OrdersService';
import PlaceOrderArg from './types/args/PlaceOrderArg';
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
import { ExpectReturnValueToContainInTests } from '../../backk/decorators/service/function/ExpectReturnValueToContainInTests';
import { Create } from '../../backk/decorators/service/function/Create';
import { SalesItem } from '../salesitems/types/entities/SalesItem';
import OrderSalesItem from './types/entities/OrderSalesItem';

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
  @Create()
  async placeOrder({
    userId,
    shoppingCartId,
    salesItems,
    paymentInfo
  }: PlaceOrderArg): Promise<Order | ErrorResponse> {
    return this.dbManager.createEntity(
      {
        userId,
        orderItems: salesItems.map((salesItem, index) => ({
          id: index.toString(),
          state: 'toBeDelivered' as OrderState,
          trackingUrl: null,
          deliveryTimestamp: null,
          salesItems
        })),
        paymentInfo
      },
      Order,
      [
        () => this.updateSalesItemStates(salesItems, 'sold', 'forSale'),
        () => this.shoppingCartService.emptyShoppingCart({ _id: shoppingCartId, userId })
      ],
      () =>
        sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderCreateNotifications`,
          {
            userId,
            salesItems
          }
        )
    );
  }

  @AllowForSelf()
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
  @ExpectReturnValueToContainInTests({ orderItems: [] })
  deleteOrderItem({ _id, orderItemId }: DeleteOrderItemArg): Promise<Order | ErrorResponse> {
    return this.dbManager.removeSubEntityById(
      _id,
      'orderItems',
      orderItemId,
      Order,
      {
        entityJsonPathForPreHookFuncArg: `orderItems[?(@.id == '${orderItemId}')]`,
        preHookFunc: ([{ state }]) => state === 'toBeDelivered',
        errorMessageOnPreHookFuncExecFailure: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
      },
      () =>
        sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/refund-service.vitja/refundService.refundOrderItem`,
          {
            orderId: _id,
            orderItemId
          }
        )
    );
  }

  @AllowForTests()
  addOrderItem({ orderId, salesItems, version }: AddOrderItemArg): Promise<Order | ErrorResponse> {
    return this.dbManager.addSubEntity(
      orderId,
      version,
      'orderItems',
      {
        salesItems,
        state: 'toBeDelivered',
        trackingUrl: null,
        deliveryTimestamp: null
      },
      Order,
      OrderItem
    );
  }

  @AllowForSelf()
  getOrder({ _id }: _IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @Update()
  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
  async deliverOrderItem({
    _id,
    version,
    orderItemId,
    ...restOfArg
  }: DeliverOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      {
        version,
        _id,
        orderItems: [{ state: 'delivering', id: orderItemId, ...restOfArg }]
      },
      Order,
      [],
      {
        entityJsonPathForPreHookFuncArg: `orderItems[?(@.id == '${orderItemId}')]`,
        preHookFunc: ([{ state }]) => state === 'toBeDelivered',
        errorMessageOnPreHookFuncExecFailure: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
      },
      () =>
        sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderItemDeliveryNotification`,
          {
            orderId: _id,
            orderItemId,
            ...restOfArg
          }
        )
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([INVALID_ORDER_ITEM_STATE])
  async updateOrderItemState({
    _id,
    version,
    orderItemId,
    newState
  }: UpdateOrderItemStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateEntity(
      { _id, version, orderItems: [{ id: orderItemId, state: newState }] },
      Order,
      [],
      [
        {
          executePreHookFuncIf: () => newState === 'returned',
          entityJsonPathForPreHookFuncArg: `orderItems[?(@.id == '${orderItemId}')]`,
          preHookFunc: ([{ salesItemId }]) =>
            this.salesItemsService.updateSalesItemState({
              _id: salesItemId,
              newState: 'forSale'
            })
        },
        {
          entityJsonPathForPreHookFuncArg: `orderItems[?(@.id == '${orderItemId}')]`,
          preHookFunc: ([{ state }]) => state === OrdersServiceImpl.getValidPreviousOrderStateFor(newState),
          errorMessageOnPreHookFuncExecFailure: INVALID_ORDER_ITEM_STATE
        }
      ],
      {
        executePostHookIf: () => newState === 'returned',
        postHookFunc: () =>
          sendToRemoteService(
            `kafka://${process.env.KAFKA_SERVER}/refund-service.vitja/refundService.refundOrderItem`,
            {
              orderId: _id,
              orderItemId
            }
          )
      }
    );
  }

  @AllowForSelf()
  deleteOrder({ _id }: _IdAndUserId): Promise<void | ErrorResponse> {
    return this.dbManager.deleteEntityById(_id, Order, [
      {
        entityJsonPathForPreHookFuncArg: 'orderItems[?(@.state != "toBeDelivered")]',
        preHookFunc: (orderItemsInDelivery) => orderItemsInDelivery.length === 0,
        errorMessageOnPreHookFuncExecFailure: DELETE_ORDER_NOT_ALLOWED,
        shouldDisregardFailureWhenExecutingTests: true
      },
      {
        entityJsonPathForPreHookFuncArg: 'orderItems[*].salesItemId',
        preHookFunc: async (salesItemIds) => await this.updateSalesItemStates(salesItemIds, 'forSale')
      }
    ]);
  }

  private async updateSalesItemStates(
    salesItems: OrderSalesItem[],
    newState: SalesItemState,
    currentState?: SalesItemState
  ): Promise<void | ErrorResponse> {
    return await executeForAll(
      salesItems,
      async ({ salesItemId }) =>
        await this.salesItemsService.updateSalesItemState(
          {
            _id: salesItemId,
            newState
          },
          currentState
        )
    );
  }

  private static getValidPreviousOrderStateFor(newState: OrderState): OrderState {
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
