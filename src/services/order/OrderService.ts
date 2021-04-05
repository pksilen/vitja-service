import PlaceOrderArg from "./types/args/PlaceOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entities/Order";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import _Id from "../../backk/types/id/_Id";
import PayOrderArg from "./types/args/PayOrderArg";
import _IdAndUserAccountId from "../../backk/types/id/_IdAndUserAccountId";
import { PromiseErrorOr } from "../../backk/types/PromiseErrorOr";
import RemoveOrderItemArg from "./types/args/RemoveOrderItemArg";
import DeleteUnpaidOrdersArg from "./types/args/DeleteUnpaidOrdersArg";
import _IdAndOrderItemId from "./types/args/_IdAndOrderItemId";

export default abstract class OrderService extends CrudEntityService {
  abstract deleteAllOrders(): PromiseErrorOr<null>;
  abstract placeOrder(arg: PlaceOrderArg): PromiseErrorOr<Order>;
  abstract getOrder(arg: _IdAndUserAccountId): PromiseErrorOr<Order>;
  abstract discardUnpaidOrder(arg: _Id): PromiseErrorOr<null>;
  abstract payOrder(arg: PayOrderArg):PromiseErrorOr<null>;
  abstract removeUndeliveredOrderItem(arg: RemoveOrderItemArg): PromiseErrorOr<null>;
  abstract deleteUndeliveredPaidOrder(arg: _IdAndUserAccountId): PromiseErrorOr<null>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): PromiseErrorOr<null>;
  abstract receiveOrderItem(arg: _IdAndOrderItemId): PromiseErrorOr<null>;
  abstract returnOrderItem(arg: _IdAndOrderItemId): PromiseErrorOr<null>;
  abstract receiveReturnedOrderItem(arg: _IdAndOrderItemId): PromiseErrorOr<null>;
  abstract deleteUnpaidOrders(arg: DeleteUnpaidOrdersArg): PromiseErrorOr<null>;
}
