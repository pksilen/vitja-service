import { ErrorResponse, IdWrapper } from "../../backk/Backk";
import OrderWithoutIdAndCreatedTimestampAndState from "./types/OrderWithoutIdAndCreatedTimestampAndState";
import Order from "./types/Order";
import ShoppingCartItem from "../shoppingcart/types/ShoppingCartItem";
import OrderWithoutCreatedTimestampAndState from "./types/OrderWithoutCreatedTimestampAndState";
import OrderIdAndState from "./types/OrderIdAndState";
import UserIdAndOptionalPostQueryOperations from "../users/types/UserIdAndOptionalPostQueryOperations";

export default abstract class OrdersService {
  readonly Types = {
    IdWrapper,
    UserIdAndOptionalPostQueryOperations,
    OrderIdAndState,
    OrderWithoutIdAndCreatedTimestampAndState,
    OrderWithoutCreatedTimestampAndState,
    Order,
    ShoppingCartItem
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(
    orderWithoutIdAndCreatedTimestampAndState: OrderWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse>;
  abstract getOrdersByUserId({ userId }: UserIdAndOptionalPostQueryOperations): Promise<Order[] | ErrorResponse>;
  abstract getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse>;
  abstract updateOrder(
    orderWithoutCreatedTimestampAndState: OrderWithoutCreatedTimestampAndState
  ): Promise<void | ErrorResponse>;
  abstract updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse>;
  abstract deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse>;
}
