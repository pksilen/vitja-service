import Version from "../../../../backk/types/Version";
import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import ShoppingCartOrOrderSalesItem from "../entities/ShoppingCartOrOrderSalesItem";

export default class AddOrderItemArg extends Version {
  orderId!: string;

  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  salesItems!: ShoppingCartOrOrderSalesItem[];
}
