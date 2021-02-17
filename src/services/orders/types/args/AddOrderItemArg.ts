import Version from "../../../../backk/types/Version";
import { ArrayMaxSize } from "class-validator";
import OrderSalesItem from "../entities/OrderSalesItem";

export default class AddOrderItemArg extends Version {
  orderId!: string;

  @ArrayMaxSize(1)
  salesItems!: OrderSalesItem[];
}
