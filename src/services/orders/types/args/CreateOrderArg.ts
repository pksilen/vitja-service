import { ArrayMaxSize, ArrayUnique } from "class-validator";

export default class CreateOrderArg {
  userId!: string;

  shoppingCartId!: string;

  @ArrayMaxSize(50)
  @ArrayUnique()
  salesItemIds!: string[];
}
