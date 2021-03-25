import PlaceOrderArg from "./types/args/PlaceOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entities/Order";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import _Id from "../../backk/types/id/_Id";
import PayOrderArg from "./types/args/PayOrderArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";
import RemoveOrderItemArg from "./types/args/RemoveOrderItemArg";
import DeleteUnpaidOrdersArg from "./types/args/DeleteUnpaidOrdersArg";
import _IdAndOrderItemId from "./types/args/_IdAndOrderItemId";

export default abstract class OrderService extends CrudEntityService {
  abstract deleteAllOrders(): PromiseOfErrorOr<null>;
  abstract placeOrder(arg: PlaceOrderArg): PromiseOfErrorOr<Order>;
  abstract getOrder(arg: _IdAndUserAccountId): PromiseOfErrorOr<Order>;
  abstract discardUnpaidOrder(arg: _Id): PromiseOfErrorOr<null>;
  abstract payOrder(arg: PayOrderArg):PromiseOfErrorOr<null>;
  abstract removeUndeliveredOrderItem(arg: RemoveOrderItemArg): PromiseOfErrorOr<null>;
  abstract deleteUndeliveredPaidOrder(arg: _IdAndUserAccountId): PromiseOfErrorOr<null>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): PromiseOfErrorOr<null>;
  abstract receiveOrderItem(arg: _IdAndOrderItemId): PromiseOfErrorOr<null>;
  abstract returnOrderItem(arg: _IdAndOrderItemId): PromiseOfErrorOr<null>;
  abstract receiveReturnedOrderItem(arg: _IdAndOrderItemId): PromiseOfErrorOr<null>;
  abstract deleteUnpaidOrders(arg: DeleteUnpaidOrdersArg): PromiseOfErrorOr<null>;
}
