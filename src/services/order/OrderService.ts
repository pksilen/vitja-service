import PlaceOrderArg from "./types/args/PlaceOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entities/Order";
import DeleteOrderItemArg from "./types/args/DeleteOrderItemArg";
import AddOrderItemArg from "./types/args/AddOrderItemArg";
import UpdateOrderItemStateArg from "./types/args/UpdateOrderItemStateArg";
import { BackkError } from "../../backk/types/BackkError";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import PayOrderArg from "./types/args/PayOrderArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import { ErrorOr } from "../../backk/types/ErrorOr";

export default abstract class OrderService extends CrudResourceService {
  abstract deleteAllOrders(): ErrorOr<null>;
  abstract placeOrder(arg: PlaceOrderArg): ErrorOr<Order>;
  abstract deleteOrderItem(arg: DeleteOrderItemArg): ErrorOr<Order>;
  abstract addOrderItem(arg: AddOrderItemArg): ErrorOr<Order>;
  abstract getOrder(arg: _IdAndUserAccountId): ErrorOr<Order>;
  abstract payOrder(arg: PayOrderArg):ErrorOr<null>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): ErrorOr<null>;
  abstract updateOrderItemState(arg: UpdateOrderItemStateArg): ErrorOr<null>;
  abstract discardOrder(arg: _Id): ErrorOr<null>;
  abstract deleteOrder(arg: _IdAndUserAccountId): ErrorOr<null>;
  abstract deleteIncompleteOrders(): ErrorOr<null>;
}
