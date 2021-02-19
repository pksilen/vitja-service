import Version from "../../../../backk/types/Version";
import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import OrderSalesItem from "../entities/OrderSalesItem";

export default class AddOrderItemArg extends Version {
  orderId!: string;

  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  salesItems!: OrderSalesItem[];
}
