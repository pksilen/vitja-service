import { ErrorResponse, IdAndUserId } from "../../backk/Backk";
import BaseService from "../../backk/BaseService";
import ShoppingCartItem from "../shoppingcart/types/entities/ShoppingCartItem";
import GetByUserIdArg from "../users/types/args/GetByUserIdArg";
import CreateOrderArg from "./types/args/CreateOrderArg";
import DeliverOrderItemArg from "./types/args/DeliverOrderItemArg";
import Order from "./types/entity/Order";
import OrderItem from "./types/entity/OrderItem";
import DeleteOrderItemArg from "./types/args/DeleteOrderItemArg";
import AddOrderItemArg from "./types/args/AddOrderItemArg";
import UpdateOrderItemStateArg from "./types/args/UpdateOrderItemStateArg";

export default abstract class OrdersService extends BaseService {
  readonly Types = {
    AddOrderItemArg,
    CreateOrderArg,
    DeleteOrderItemArg,
    DeliverOrderItemArg,
    GetByUserIdArg,
    Order,
    OrderItem,
    ShoppingCartItem,
    UpdateOrderItemStateArg
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(arg: CreateOrderArg): Promise<Order | ErrorResponse>;
  abstract deleteOrderItem(arg: DeleteOrderItemArg): Promise<void | ErrorResponse>;
  abstract addOrderItem(arg: AddOrderItemArg): Promise<Order | ErrorResponse>;
  abstract getOrdersByUserId(arg: GetByUserIdArg): Promise<Order[] | ErrorResponse>;
  abstract getOrderById(arg: IdAndUserId): Promise<Order | ErrorResponse>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): Promise<void | ErrorResponse>;
  abstract updateOrderItemState(arg: UpdateOrderItemStateArg): Promise<void | ErrorResponse>;
  abstract deleteOrderById(arg: IdAndUserId): Promise<void | ErrorResponse>;
}
