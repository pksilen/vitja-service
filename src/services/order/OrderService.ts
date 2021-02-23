import PlaceOrderArg from "./types/args/PlaceOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entities/Order";
import DeleteOrderItemArg from "./types/args/DeleteOrderItemArg";
import AddOrderItemArg from "./types/args/AddOrderItemArg";
import UpdateOrderItemStateArg from "./types/args/UpdateOrderItemStateArg";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import _Id from "../../backk/types/id/_Id";
import PayOrderArg from "./types/args/PayOrderArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

export default abstract class OrderService extends CrudResourceService {
  abstract deleteAllOrders(): PromiseOfErrorOr<null>;
  abstract placeOrder(arg: PlaceOrderArg): PromiseOfErrorOr<Order>;
  abstract deleteOrderItem(arg: DeleteOrderItemArg): PromiseOfErrorOr<Order>;
  abstract addOrderItem(arg: AddOrderItemArg): PromiseOfErrorOr<Order>;
  abstract getOrder(arg: _IdAndUserAccountId): PromiseOfErrorOr<Order>;
  abstract payOrder(arg: PayOrderArg):PromiseOfErrorOr<null>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): PromiseOfErrorOr<null>;
  abstract updateOrderItemState(arg: UpdateOrderItemStateArg): PromiseOfErrorOr<null>;
  abstract discardOrder(arg: _Id): PromiseOfErrorOr<null>;
  abstract deleteOrder(arg: _IdAndUserAccountId): PromiseOfErrorOr<null>;
  abstract deleteIncompleteOrders(): PromiseOfErrorOr<null>;
}
