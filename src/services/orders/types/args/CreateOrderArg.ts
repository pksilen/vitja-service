import { ArrayMaxSize, ArrayUnique } from "class-validator";

export default class CreateOrderArg {
  userId!: string;

  @ArrayMaxSize(50)
  @ArrayUnique()
  salesItemIds!: string[];
}
