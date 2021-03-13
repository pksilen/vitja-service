import PlaceOrderArg from "./types/args/PlaceOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entities/Order";
import DeleteOrderItemArg from "./types/args/DeleteOrderItemArg";
import AddOrderItemArg from "./types/args/AddOrderItemArg";
import UpdateOrderItemStateArg from "./types/args/UpdateOrderItemStateArg";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import _Id from "../../backk/types/id/_Id";
import PayOrderArg from "./types/args/PayOrderArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

export default abstract class OrderService extends CrudEntityService {
  abstract deleteAllOrders(): PromiseOfErrorOr<null>;
  abstract placeOrder(arg: PlaceOrderArg): PromiseOfErrorOr<Order>;
  abstract getOrder(arg: _IdAndUserAccountId): PromiseOfErrorOr<Order>;
  abstract removeOrderItem(arg: DeleteOrderItemArg): PromiseOfErrorOr<null>;
  abstract addOrderItem(arg: AddOrderItemArg): PromiseOfErrorOr<null>;
  abstract payOrder(arg: PayOrderArg):PromiseOfErrorOr<null>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): PromiseOfErrorOr<null>;
  abstract updateOrderItemState(arg: UpdateOrderItemStateArg): PromiseOfErrorOr<null>;
  abstract discardOrder(arg: _Id): PromiseOfErrorOr<null>;
  abstract deleteOrder(arg: _IdAndUserAccountId): PromiseOfErrorOr<null>;
  abstract deleteIncompleteOrders(): PromiseOfErrorOr<null>;
}
