import Version from "../../../../backk/types/Version";
import { ArrayMaxSize } from "class-validator";
import ShoppingCartOrOrderSalesItem from "../entities/ShoppingCartOrOrderSalesItem";

export default class AddOrderItemArg extends Version {
  orderId!: string;

  @ArrayMaxSize(1)
  salesItems!: ShoppingCartOrOrderSalesItem[];
}
