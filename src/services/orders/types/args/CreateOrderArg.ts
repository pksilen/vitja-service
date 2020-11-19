import { ArrayMaxSize } from "class-validator";

export default class CreateOrderArg {
  userId!: string;

  @ArrayMaxSize(50)
  salesItemIds!: string[];
}
