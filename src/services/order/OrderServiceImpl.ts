import { Injectable } from '@nestjs/common';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
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
import { BackkError } from '../../backk/types/BackkError';
import {
  DELETE_ORDER_NOT_ALLOWED,
  INVALID_ORDER_ITEM_STATE,
  ORDER_ALREADY_PAID,
  ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
} from './errors/orderServiceErrors';
import { Errors } from '../../backk/decorators/service/function/Errors';
import executeForAll from '../../backk/utils/executeForAll';
import ShoppingCartService from '../shoppingcart/ShoppingCartService';
import { SalesItemState } from '../salesitem/types/enums/SalesItemState';
import { OrderState } from './types/enum/OrderState';
import { Update } from '../../backk/decorators/service/function/Update';
import sendToRemoteService from '../../backk/remote/messagequeue/sendToRemoteService';
import { ExpectReturnValueToContainInTests } from '../../backk/decorators/service/function/ExpectReturnValueToContainInTests';
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
import dayjs from "dayjs";
import SqlEquals from "../../backk/dbmanager/sql/expressions/SqlEquals";
import SqlExpression from "../../backk/dbmanager/sql/expressions/SqlExpression";
import ShoppingCartOrOrderSalesItem from "../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrderServiceImpl extends OrderService {
  constructor(
    dbManager: AbstractDbManager,
    private readonly salesItemService: SalesItemService,
    private readonly shoppingCartService: ShoppingCartService
  ) {
    super(dbManager);
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
      () => this.updateSalesItemStates(salesItems, 'sold', 'forSale')
    );
  }

  @AllowForSelf()
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
  @ExpectReturnValueToContainInTests({ orderItems: [] })
  deleteOrderItem({ _id, orderItemId }: DeleteOrderItemArg): PromiseOfErrorOr<Order> {
    return this.dbManager.removeSubEntityById(
      _id,
      'orderItems',
      orderItemId,
      Order,
      {
        isSuccessfulOrTrue: (order) =>
          JSONPath({ json: order, path: `orderItems[?(@.id == '${orderItemId}')].state` })[0] ===
          'toBeDelivered',
        errorMessage: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
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
  addOrderItem({ orderId, salesItem, version }: AddOrderItemArg): PromiseOfErrorOr<Order> {
    return this.dbManager.addSubEntity(
      orderId,
      version,
      'orderItems',
      {
        salesItems: [salesItem],
        state: 'toBeDelivered',
        trackingUrl: null,
        deliveryTimestamp: null
      },
      Order,
      OrderItem
    );
  }

  @AllowForSelf()
  getOrder({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<Order> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @AllowForUserRoles(['vitjaPaymentGateway'])
  @Update()
  @Errors([ORDER_ALREADY_PAID])
  payOrder({ _id, ...paymentInfo }: PayOrderArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, paymentInfo },
      Order,
      [
        () => this.shoppingCartService.deleteShoppingCart({ _id }),
        {
          isSuccessfulOrTrue: ({ paymentInfo }) => paymentInfo.transactionId === null,
          errorMessage: ORDER_ALREADY_PAID
        }
      ],
      () =>
        sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderCreateNotifications`,
          {
            orderId: _id
          }
        )
    );
  }

  @Update()
  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Errors([ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED])
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
        isSuccessfulOrTrue: (order) =>
          JSONPath({ json: order, path: `orderItems[?(@.id == '${orderItemId}')].state` })[0] ===
          'toBeDelivered',
        errorMessage: ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED
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
  }: UpdateOrderItemStateArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, version, orderItems: [{ id: orderItemId, state: newState }] },
      Order,
      [
        {
          shouldExecutePreHook: () => newState === 'returned',
          isSuccessfulOrTrue: (order) =>
            this.salesItemService.updateSalesItemState({
              _id: JSONPath({
                json: order,
                path: `orderItems[?(@.id == '${orderItemId}')].salesItems[0]._id`
              })[0],
              newState: 'forSale'
            })
        },
        {
          isSuccessfulOrTrue: (order) =>
            JSONPath({
              json: order,
              path: `orderItems[?(@.id == '${orderItemId}')].state`
            })[0] === OrderServiceImpl.getValidPreviousOrderStateFor(newState),
          errorMessage: INVALID_ORDER_ITEM_STATE
        }
      ],
      {
        shouldExecutePostHook: () => newState === 'returned',
        isSuccessful: () =>
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
        new SqlExpression(
          `lastModifiedTimestamp <= current_timestamp - INTERVAL '1' hour`
        )
      ]
    );

    return this.dbManager.deleteEntitiesByFilters(filters, Order);
  }

  private async updateSalesItemStates(
    salesItems: ShoppingCartOrOrderSalesItem[],
    newState: SalesItemState,
    currentState?: SalesItemState
  ): PromiseOfErrorOr<null> {
    return await executeForAll(salesItems, ({ _id }) =>
      this.salesItemService.updateSalesItemState(
        {
          _id,
          newState
        },
        currentState
      )
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
    return this.dbManager.deleteEntityById(_id, Order, [
      {
        isSuccessfulOrTrue: (order) =>
          JSONPath({ json: order, path: 'orderItems[?(@.state != "toBeDelivered")]' }).length === 0,
        errorMessage: DELETE_ORDER_NOT_ALLOWED,
        shouldDisregardFailureWhenExecutingTests: true
      },
      (order) =>
        this.updateSalesItemStates(JSONPath({ json: order, path: 'orderItems[*].salesItems' }), 'forSale')
    ]);
  }
}
