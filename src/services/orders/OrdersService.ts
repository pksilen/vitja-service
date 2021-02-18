import PlaceOrderArg from "./types/args/PlaceOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entities/Order";
import DeleteOrderItemArg from "./types/args/DeleteOrderItemArg";
import AddOrderItemArg from "./types/args/AddOrderItemArg";
import UpdateOrderItemStateArg from "./types/args/UpdateOrderItemStateArg";
import _IdAndUserId from "../../backk/types/id/_IdAndUserId";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import PayOrderArg from "./types/args/PayOrderArg";

export default abstract class OrdersService extends CrudResourceService {
  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract placeOrder(arg: PlaceOrderArg): Promise<Order | ErrorResponse>;
  abstract deleteOrderItem(arg: DeleteOrderItemArg): Promise<Order | ErrorResponse>;
  abstract addOrderItem(arg: AddOrderItemArg): Promise<Order | ErrorResponse>;
  abstract getOrder(arg: _IdAndUserId): Promise<Order | ErrorResponse>;
  abstract payOrder(arg: PayOrderArg):Promise<void | ErrorResponse>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): Promise<void | ErrorResponse>;
  abstract updateOrderItemState(arg: UpdateOrderItemStateArg): Promise<void | ErrorResponse>;
  abstract discardOrder(arg: _Id): Promise<void | ErrorResponse>;
  abstract deleteOrder(arg: _IdAndUserId): Promise<void | ErrorResponse>;
}
