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
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import ShoppingCartService from '../shoppingcart/ShoppingCartService';
import { OrderItemState } from './types/enum/OrderItemState';
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
import { orderServiceErrors } from './errors/orderServiceErrors';
import RemoveOrderItemArg from './types/args/RemoveOrderItemArg';
import DeleteUnpaidOrdersArg from './types/args/DeleteUnpaidOrdersArg';
import { EntityPreHook } from '../../backk/dbmanager/hooks/EntityPreHook';
import _IdAndOrderItemId from './types/args/_IdAndOrderItemId';
import SqlInExpression from '../../backk/dbmanager/sql/expressions/SqlInExpression';
import { SalesItem } from '../salesitem/types/entities/SalesItem';

@Injectable()
@AllowServiceForUserRoles(['vitjaAdmin'])
export default class OrderServiceImpl extends OrderService {
  private readonly isPaidOrderPreHook: EntityPreHook<Order> = {
    isSuccessfulOrTrue: ({ transactionId }) => transactionId !== null,
    error: orderServiceErrors.cannotUpdateOrderWhichIsNotPaid
  };

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
  placeOrder({
    userAccountId,
    iAgreeWithTermsAndConditions,
    paymentGateway
  }: PlaceOrderArg): PromiseOfErrorOr<Order> {
    return this.dbManager.executeInsideTransaction(async () => {
      const [shoppingCart, error] = await this.shoppingCartService.getShoppingCartOrErrorIfEmpty(
        userAccountId,
        orderServiceErrors.shoppingCartIsEmpty
      );

      return shoppingCart
        ? this.dbManager.createEntity(
            {
              userAccountId,
              orderItems: shoppingCart.salesItems.map((salesItem, index) => ({
                id: index.toString(),
                state: 'toBeDelivered',
                trackingUrl: null,
                deliveryTimestamp: null,
                salesItems: [salesItem]
              })),
              paymentGateway,
              transactionId: null,
              transactionTimestamp: null,
              paymentAmount: null
            },
            Order,
            {
              preHooks: [
                {
                  isSuccessfulOrTrue: () => iAgreeWithTermsAndConditions,
                  error: orderServiceErrors.notAgreedWithTermsAndConditions
                },
                () =>
                  this.salesItemService.updateSalesItemStates(
                    shoppingCart.salesItems,
                    'sold',
                    'reserved',
                    userAccountId
                  )
              ]
            }
          )
        : [null, error];
    });
  }

  @AllowForSelf()
  getOrder({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<Order> {
    return this.dbManager.getEntityById(_id, Order);
  }

  @AllowForUserRoles(['vitjaPaymentGateway'])
  @Delete()
  discardUnpaidOrder({ _id }: _Id): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, Order, {
      preHooks: (order) =>
        this.salesItemService.updateSalesItemStates(
          JSONPath({ json: order, path: 'orderItems[*].salesItems[*]' }),
          'reserved',
          'sold',
          order.userAccountId
        )
    });
  }

  @AllowForUserRoles(['vitjaPaymentGateway'])
  @Update('update')
  payOrder({ _id, ...restOfEntity }: PayOrderArg): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity({ _id, ...restOfEntity }, Order, {
      preHooks: [
        ({ userAccountId }) => this.shoppingCartService.deleteShoppingCart({ userAccountId }),
        {
          isSuccessfulOrTrue: ({ transactionId }) => transactionId === null,
          error: orderServiceErrors.orderAlreadyPaid
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

  @AllowForSelf()
  @Update('addOrRemove')
  removeUndeliveredOrderItem({ _id, orderItemId }: RemoveOrderItemArg): PromiseOfErrorOr<null> {
    return this.dbManager.removeSubEntityById(_id, 'orderItems', orderItemId, Order, {
      preHooks: [
        this.isPaidOrderPreHook,
        {
          isSuccessfulOrTrue: (order) =>
            JSONPath({ json: order, path: `orderItems[?(@.id == '${orderItemId}')].state` })[0] ===
            'toBeDelivered',
          error: orderServiceErrors.cannotRemoveDeliveredOrderItem
        },
        (order) => this.updateSalesItemStateToForSale(order, orderItemId)
      ],
      postHook: () => OrderServiceImpl.refundOrderItem(_id, orderItemId)
    });
  }

  @AllowForSelf()
  deleteUndeliveredPaidOrder({ _id }: _IdAndUserAccountId): PromiseOfErrorOr<null> {
    return this.dbManager.deleteEntityById(_id, Order, {
      preHooks: [
        this.isPaidOrderPreHook,
        {
          isSuccessfulOrTrue: (order) =>
            JSONPath({ json: order, path: 'orderItems[?(@.state != "toBeDelivered")]' }).length === 0,
          error: orderServiceErrors.deliveredOrderDeleteNotAllowed
        },
        (order) =>
          this.salesItemService.updateSalesItemStates(
            JSONPath({ json: order, path: 'orderItems[*].salesItems[*]' }),
            'forSale'
          )
      ],
      postHook: () =>
        sendToRemoteService(
          `kafka://${process.env.KAFKA_SERVER}/refund-service.vitja/refundService.refundOrder`,
          {
            orderId: _id
          }
        )
    });
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Update('update')
  async deliverOrderItem({ _id, version, orderItems }: DeliverOrderItemArg): PromiseOfErrorOr<null> {
    const [orderItem] = orderItems;

    return this.dbManager.updateEntity(
      {
        version,
        _id,
        orderItems: [{ ...orderItem, state: 'delivering' }]
      },
      Order,
      {
        preHooks: [
          this.isPaidOrderPreHook,
          {
            isSuccessfulOrTrue: (order) =>
              OrderServiceImpl.hasOrderItemState(order, orderItem.id, 'toBeDelivered'),
            error: orderServiceErrors.orderItemAlreadyDelivered
          }
        ],
        postHook: () =>
          sendToRemoteService(
            `kafka://${process.env.KAFKA_SERVER}/notification-service.vitja/orderNotificationsService.sendOrderItemDeliveryNotification`,
            {
              orderId: _id,
              orderItem
            }
          )
      }
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Update('update')
  async receiveOrderItem({ _id, version, orderItemId }: _IdAndOrderItemId): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, version, orderItems: [{ id: orderItemId, state: 'delivered' }] },
      Order,
      {
        preHooks: [
          this.isPaidOrderPreHook,
          {
            isSuccessfulOrTrue: (order) =>
              OrderServiceImpl.hasOrderItemState(order, orderItemId, 'delivering'),
            error: orderServiceErrors.invalidOrderItemCurrentState
          }
        ]
      }
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Update('update')
  async returnOrderItem({ _id, version, orderItemId }: _IdAndOrderItemId): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, version, orderItems: [{ id: orderItemId, state: 'returning' }] },
      Order,
      {
        preHooks: [
          this.isPaidOrderPreHook,
          {
            isSuccessfulOrTrue: (order) =>
              OrderServiceImpl.hasOrderItemState(order, orderItemId, 'delivered'),
            error: orderServiceErrors.invalidOrderItemCurrentState
          }
        ]
      }
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  @Update('update')
  async receiveReturnedOrderItem({ _id, version, orderItemId }: _IdAndOrderItemId): PromiseOfErrorOr<null> {
    return this.dbManager.updateEntity(
      { _id, version, orderItems: [{ id: orderItemId, state: 'returned' }] },
      Order,
      {
        preHooks: [
          this.isPaidOrderPreHook,
          (order) => this.updateSalesItemStateToForSale(order, orderItemId),
          {
            isSuccessfulOrTrue: (order) =>
              OrderServiceImpl.hasOrderItemState(order, orderItemId, 'returning'),
            error: orderServiceErrors.invalidOrderItemCurrentState
          }
        ],
        postHook: () => OrderServiceImpl.refundOrderItem(_id, orderItemId)
      }
    );
  }

  @CronJob({ minuteInterval: 5 })
  deleteUnpaidOrders({ unpaidOrderTimeToLiveInMinutes }: DeleteUnpaidOrdersArg): PromiseOfErrorOr<null> {
    return this.dbManager.executeInsideTransaction(async () => {
      const orderFilters = this.dbManager.getFilters(
        {
          transactionId: null,
          lastModifiedTimestamp: {
            $lte: dayjs()
              .subtract(unpaidOrderTimeToLiveInMinutes, 'minutes')
              .toDate()
          }
        },
        [
          new SqlEquals({ transactionId: null }),
          new SqlExpression(
            `lastmodifiedtimestamp <= current_timestamp - INTERVAL '${unpaidOrderTimeToLiveInMinutes}' minute`
          )
        ]
      );

      const [orders, error] = await this.dbManager.getEntitiesByFilters<Order>(orderFilters, Order, {
        includeResponseFields: ['orderItems.salesItems._id'],
        paginations: [{ subEntityPath: '*', pageSize: 1000, pageNumber: 1 }]
      });

      if (orders) {
        const salesItemIdsToUpdate = JSONPath({ json: orders, path: '$[*].orderItems[*].salesItems[*]._id' });
        if (salesItemIdsToUpdate.length > 0) {
          const salesItemFilters = this.dbManager.getFilters({ _id: { $in: salesItemIdsToUpdate } }, [
            new SqlInExpression('_id', salesItemIdsToUpdate)
          ]);

          const [, error] = await this.dbManager.updateEntitiesByFilters<SalesItem>(
            salesItemFilters,
            { state: 'forSale' },
            SalesItem
          );

          return error ? [null, error] : this.dbManager.deleteEntitiesByFilters(orderFilters, Order);
        }
      }

      return [null, error];
    });
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
      }/${getServiceName()}/ordersService.payOrder?_id=${orderId}&transactionId=transactionId&transactionTimestamp=transactionTimestamp&paymentAmount=paymentAmount`
    );

    const failureUrl = encodeURIComponent(
      `https://${
        process.env.API_GATEWAY_FQDN
      }/${getServiceName()}/ordersService.discardUnpaidOrder?_id=${orderId}`
    );

    const paymentSuccessMessage = `Order with id ${orderId} was successfully registered and paid`;
    const successUiRedirectUrl = encodeURIComponent(`${uiRedirectUrl}?message=${paymentSuccessMessage}`);
    const paymentFailureMessage = `Order payment failed`;
    const failureRedirectUrl = encodeURIComponent(`${uiRedirectUrl}?message=${paymentFailureMessage}`);

    return `https://${paymentGatewayHost}/${paymentGatewayUrlPath}?successUrl=${successUrl}&failureUrl=${failureUrl}&successRedirectUrl=${successUiRedirectUrl}&failureRedirectUrl=${failureRedirectUrl}`;
  }

  private static hasOrderItemState(
    order: Order,
    orderItemId: string,
    requiredState: OrderItemState
  ): boolean {
    return (
      JSONPath({
        json: order,
        path: `orderItems[?(@.id == '${orderItemId}')].state`
      })[0] === requiredState
    );
  }

  private updateSalesItemStateToForSale(order: Order, orderItemId: string): PromiseOfErrorOr<null> {
    return this.salesItemService.updateSalesItemState(
      JSONPath({
        json: order,
        path: `orderItems[?(@.id == '${orderItemId}')].salesItems[0]._id`
      })[0],
      'forSale'
    );
  }
}
