import CreateOrderArg from "./CreateOrderArg";
import { MaxLength } from "class-validator";

export default class UpdateOrderArg extends CreateOrderArg {
  @MaxLength(24)
  _id!: string;
}
