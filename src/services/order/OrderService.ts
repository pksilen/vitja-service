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

export default abstract class OrderService extends CrudResourceService {
  abstract deleteAllOrders(): Promise<BackkError | null>;
  abstract placeOrder(arg: PlaceOrderArg): Promise<[Order, BackkError | null]>;
  abstract deleteOrderItem(arg: DeleteOrderItemArg): Promise<[Order, BackkError | null]>;
  abstract addOrderItem(arg: AddOrderItemArg): Promise<[Order, BackkError | null]>;
  abstract getOrder(arg: _IdAndUserAccountId): Promise<[Order, BackkError | null]>;
  abstract payOrder(arg: PayOrderArg):Promise<BackkError | null>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): Promise<BackkError | null>;
  abstract updateOrderItemState(arg: UpdateOrderItemStateArg): Promise<BackkError | null>;
  abstract discardOrder(arg: _Id): Promise<BackkError | null>;
  abstract deleteOrder(arg: _IdAndUserAccountId): Promise<BackkError | null>;
  abstract deleteIncompleteOrders(): Promise<BackkError | null>;
}
