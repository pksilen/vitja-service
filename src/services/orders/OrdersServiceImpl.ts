import { Injectable } from '@nestjs/common';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import AllowServiceForUserRoles from '../../backk/annotations/service/AllowServiceForUserRoles';
import { AllowForSelf } from '../../backk/annotations/service/function/AllowForSelf';
import { AllowForUserRoles } from '../../backk/annotations/service/function/AllowForUserRoles';
import { NoCaptcha } from '../../backk/annotations/service/function/NoCaptcha';
import { ErrorResponse, IdAndUserId } from '../../backk/Backk';
import SalesItemsService from '../salesitems/SalesItemsService';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import OrdersService from './OrdersService';
import CreateOrderArg from './types/args/CreateOrderArg';
import DeliverOrderItemArg from './types/args/DeliverOrderItemArg';
import UpdateOrderItemDeliveryStateArg from './types/args/UpdateOrderItemDeliveryStateArg';
import Order from './types/entity/Order';
import OrderItem from './types/entity/OrderItem';

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
      const errorResponse = await this.updateSalesItemStatesToSold(salesItemIds);

      return errorResponse
        ? errorResponse
        : await this.dbManager.createItem(
            {
              ...restOfArg,
              createdTimestampInSecs: Math.round(Date.now() / 1000),
              orderItems: salesItemIds.map((salesItemId) => ({
                salesItemId,
                _id: '',
                state: 'toBeDelivered' as 'toBeDelivered',
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
  getOrdersByUserId({ userId, ...postQueryOps }: GetByUserIdArg): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy('userId', userId, Order, this.Types, postQueryOps);
  }

  @AllowForSelf()
  getOrderById({ _id }: IdAndUserId): Promise<Order | ErrorResponse> {
    return this.dbManager.getItemById(_id, Order, this.Types);
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deliverOrderItem({ _id, orderItemId, ...restOfArg }: DeliverOrderItemArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(
      { _id: orderItemId, ...restOfArg, state: 'delivering' },
      OrderItem,
      this.Types
    );
  }

  @AllowForUserRoles(['vitjaLogisticsPartner'])
  updateOrderItemDeliveryState({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _id,
    orderItemId,
    ...restOfArg
  }: UpdateOrderItemDeliveryStateArg): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(
      { _id: orderItemId, ...restOfArg },
      OrderItem,
      this.Types,
      OrdersServiceImpl.getPreConditionForNewDeliveryState(restOfArg.state)
    );
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

  private static getPreConditionForNewDeliveryState(
    newDeliveryState: 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned'
  ): object {
    switch (newDeliveryState) {
      case 'delivered':
        return { state: 'delivering' };
      case 'returning':
        return { state: 'delivered' };
      case 'returned':
        return { state: 'returning' };
      default:
        return { state: newDeliveryState };
    }
  }
}
