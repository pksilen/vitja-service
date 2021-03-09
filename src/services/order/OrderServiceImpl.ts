import { Injectable } from '@nestjs/common';
import AllowServiceForUserRoles from '../../backk/decorators/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/decorators/service/function/AllowForSelf';
import { AllowForUserRoles } from '../../backk/decorators/service/function/AllowForUserRoles';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import SalesItemService from '../salesitem/SalesItemService';
import OrderService from './OrderService';
import PlaceOrderArg from './types/args/PlaceOrderArg';
import DeliverOrderItemArg from './types/args/DeliverOrderItemArg';
import Order from './types/entities/Order';
import OrderItem from './types/entities/OrderItem';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import DeleteOrderItemArg from './types/args/DeleteOrderItemArg';
import AddOrderItemArg from './types/args/AddOrderItemArg';
import UpdateOrderItemStateArg from './types/args/UpdateOrderItemStateArg';
import ShoppingCartService from '../shoppingcart/ShoppingCartService';
import { OrderState } from './types/enum/OrderState';
import { Update } from '../../backk/decorators/service/function/Update';
import sendToRemoteService from '../../backk/remote/messagequeue/sendToRemoteService';
import { Create } from '../../backk/decorators/service/function/Create';
import { HttpStatusCodes } from '../../backk/constants/constants';
import { ResponseStatusCode } from '../../backk/decorators/service/function/ResponseStatusCode';
import { ResponseHeaders } from '../../backk/decorators/service/function/ResponseHeaders';
import getServiceName from '../../backk/utils/getServiceName';
import { PaymentGateway } from './types/enum/PaymentGateway';
import _Id from '../../backk/types/id/_Id';
import { Delete } from '../../backk/decorators/service/function/Delete';
import PayOrderArg from './types/args/PayOrderArg';
import { JSONPath } from 'jsonpath-plus';
import { CronJob } from '../../backk/decorators/service/function/CronJob';
import dayjs from 'dayjs';
import SqlEquals from '../../backk/dbmanager/sql/expressions/SqlEquals';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import _IdAndUserAccountId from '../../backk/types/id/_IdAndUserAccountId';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { TestEntityAfterThisOperation } from '../../backk/decorators/service/function/TestEntityAfterThisOperation';
import { orderServiceErrors } from "./errors/orderServiceErrors";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrderServiceImpl extends OrderService {
  constructor(
    dbManager: AbstractDbManager,
    private readonly salesItemService: SalesItemService,
    private readonly shoppingCartService: ShoppingCartService
  ) {
    super(orderServiceErrors, dbManager);
  }

  @AllowForTests()
  deleteAllOrders(): PromiseOfErrorOr<null> {
    return this.dbManager.deleteAllEntities(Order);
  }

  @AllowForSelf()
  @NoCaptcha()
  @Create()
  @ResponseStatusCode(HttpStatusCodes.MOVED_PERMANENTLY)
  @ResponseHeaders<PlaceOrderArg, Order>({
    Location: ({ paymentGateway, uiRedirectUrl }, { _id }) =>
      OrderServiceImpl.getLocationHeaderUrl(paymentGateway, _id, uiRedirectUrl)
  })
  async placeOrder({
    shoppingCart: { userAccountId, salesItems },
    paymentGateway
  }: PlaceOrderArg): PromiseOfErrorOr<Order> {
    return this.dbManager.createEntity(
      {
        userAccountId,
        orderItems: salesItems.map((salesItem, index) => ({
          id: index.toString(),
          state: 'toBeDelivered',
          trackingUrl: null,
          deliveryTimestamp: null,
          salesItems: [salesItem]
        })),
        paymentInfo: {
          paymentGateway,
          transactionId: null,
          transactionTimestamp: null,
          amount: null
        }
      },
      Order,
      { preHooks: () => this.salesItemService.updateSalesItemStates(salesItems, 'sold') }
    );
  }

  @AllowForSelf()
  getOrder({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<Order> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @AllowForSelf()
  @TestEntityAfterThisOperation('expect no order items', { orderItems: [] })
  deleteOrderItem({ _id, orderItemId }: DeleteOrderItemArg): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'orderItems', orderItemId, Order, {
      preHooks: {
        isSuccessfulOrTrue: (order) =>
          JSONPath({ json: order, path: `orderItems[?(@.id == '${orderItemId}')].state` })[0] ===
          'toBeDelivered',
        errorMessage: orderServiceErrors.cannotDeleteOrderItemWhichIsAlreadyDelivered
      },
      postHook: () => OrderServiceImpl.refundOrderItem(_id, orderItemId)
    });
  }

  @AllowForTests()
  @Update('addOrRemoveSubEntities')
  @TestEntityAfterThisOperation('expect order to contain an order item', {
    'orderItems.salesItems._id': '{{salesItemId}}'
  })
  addOrderItem({ orderId, salesItemId }: AddOrderItemArg): PromiseOfErrorOr<null> {
    return this.dbManager.addSubEntity(
      orderId,
      'orderItems',
      {
        salesItems: [{ _id: salesItemId }],
        state: 'toBeDelivered',
        trackingUrl: null,
        deliveryTimestamp: null
      },
      Order,
      OrderItem
    );
  }

  @AllowForUserRoles(['vitjaPaymentGateway'])
  @Update('update')
  payOrder({ _id, ...paymentInfo }: PayOrderArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity({ _id, paymentInfo }, Order, {
      preHooks: [
        () => this.shoppingCartService.deleteShoppingCart({ _id }),
        {
          isSuccessfulOrTrue: ({ paymentInfo }) => paymentInfo.transactionId === null,
          errorMessage: orderServiceErrors.orderAlreadyPaid
        }
      ],
      postHook: () =>
        sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderCreateNotifications`,
          {
            orderId: _id
          }
        )
    });
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Update('update')
  async deliverOrderItem({
    _id,
    version,
    orderItemId,
    ...restOfArg
  }: DeliverOrderItemArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      {
        version,
        _id,
        orderItems: [{ state: 'delivering', id: orderItemId, ...restOfArg }]
      },
      Order,
      {
        preHooks: {
          isSuccessfulOrTrue: (order) =>
            JSONPath({ json: order, path: `orderItems[?(@.id == '${orderItemId}')].state` })[0] ===
            'toBeDelivered',
          errorMessage: orderServiceErrors.cannotDeliverOrderWhichIsAlreadyDelivered
        },
        postHook: () =>
          sendToRemoteService(
            `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderItemDeliveryNotification`,
            {
              orderId: _id,
              orderItemId,
              ...restOfArg
            }
          )
      }
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  async updateOrderItemState({
    _id,
    version,
    orderItemId,
    newState
  }: UpdateOrderItemStateArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, version, orderItems: [{ id: orderItemId, state: newState }] },
      Order,
      {
        preHooks: [
          {
            shouldExecutePreHook: () => newState === 'returned',
            isSuccessfulOrTrue: (order) =>
              this.salesItemService.updateSalesItemState(
                JSONPath({
                  json: order,
                  path: `orderItems[?(@.id == '${orderItemId}')].salesItems[0]._id`
                })[0],
                'forSale'
              )
          },
          {
            isSuccessfulOrTrue: (order) =>
              JSONPath({
                json: order,
                path: `orderItems[?(@.id == '${orderItemId}')].state`
              })[0] === OrderServiceImpl.getValidPreviousOrderStateFor(newState),
            errorMessage: orderServiceErrors.cannotUpdateOrderItemStateDueToInvalidCurrentState
          }
        ],
        postHook: {
          shouldExecutePostHook: () => newState === 'returned',
          isSuccessful: () => OrderServiceImpl.refundOrderItem(_id, orderItemId)
        }
      }
    );
  }

  @AllowForUserRoles(['vitjaPaymentGateway'])
  @Delete()
  discardOrder({ _id }: _Id): PromiseOfErrorOr<null> {
    return this.deleteOrderById(_id);
  }

  @AllowForSelf()
  deleteOrder({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<null> {
    return this.deleteOrderById(_id);
  }

  @CronJob({ minutes: 0, hourInterval: 1 })
  deleteIncompleteOrders(): PromiseOfErrorOr<null> {
    const filters = this.dbManager.getFilters(
      {
        'paymentInfo.transactionId': null,
        lastModifiedAtTimestamp: {
          $lte: dayjs()
            .subtract(1, 'hours')
            .toDate()
        }
      },
      [
        new SqlEquals({ transactionId: null }, 'paymentInfo'),
        new SqlExpression(`lastModifiedTimestamp <= current_timestamp - INTERVAL '1' hour`)
      ]
    );

    return this.dbManager.deleteEntitiesByFilters(filters, Order);
  }

  private static refundOrderItem(orderId: string, orderItemId: string): PromiseOfErrorOr<null> {
    return sendToRemoteService(
      `kafka://${process.env.KAFKA_SERVER}/refund-service.vitja/refundService.refundOrderItem`,
      {
        orderId,
        orderItemId
      }
    );
  }

  private static getLocationHeaderUrl(
    paymentGateway: PaymentGateway,
    orderId: string,
    uiRedirectUrl: string
  ) {
    let paymentGatewayHost;
    let paymentGatewayUrlPath;

    switch (paymentGateway) {
      case 'Paytrail':
        paymentGatewayHost = 'server.paytrail.com';
        paymentGatewayUrlPath = 'pay';
        break;
      case 'PayPal':
        paymentGatewayHost = 'server.paypal.com';
        paymentGatewayUrlPath = 'pay';
        break;
      case 'Klarna':
        paymentGatewayHost = 'server.klarna.com';
        paymentGatewayUrlPath = 'pay';
        break;
    }

    const successUrl = encodeURIComponent(
      `https://${
        process.env.API_GATEWAY_FQDN
      }/${getServiceName()}/ordersService.payOrder?_id=${orderId}&transactionId=transactionId&transactionTimestamp=transactionTimestamp&amount=amount`
    );

    const failureUrl = encodeURIComponent(
      `https://${process.env.API_GATEWAY_FQDN}/${getServiceName()}/ordersService.discardOrder?_id=${orderId}`
    );

    const paymentSuccessMessage = `Order with id ${orderId} was successfully registered and paid`;
    const successUiRedirectUrl = encodeURIComponent(`${uiRedirectUrl}?message=${paymentSuccessMessage}`);
    const paymentFailureMessage = `Order payment failed`;
    const failureRedirectUrl = encodeURIComponent(`${uiRedirectUrl}?message=${paymentFailureMessage}`);

    return `https://${paymentGatewayHost}/${paymentGatewayUrlPath}?successUrl=${successUrl}&failureUrl=${failureUrl}&successRedirectUrl=${successUiRedirectUrl}&failureRedirectUrl=${failureRedirectUrl}`;
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

  private deleteOrderById(_id: string): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, Order, {
      preHooks: [
        {
          isSuccessfulOrTrue: (order) => 
            JSONPath({ json: order, path: 'orderItems[?(@.state != "toBeDelivered")]' }).length === 0,
          errorMessage: orderServiceErrors.deleteOrderNotAllowed,
          shouldDisregardFailureWhenExecutingTests: true
        },
        (order) =>
          this.salesItemService.updateSalesItemStates(
            JSONPath({ json: order, path: 'orderItems[*].salesItems' }),
            'forSale'
          )
      ]
    });
  }
}
