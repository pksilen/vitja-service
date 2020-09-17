import OrderWithoutIdAndState from "./OrderWithoutIdAndState";
import { MaxLength } from "class-validator";

export default class OrderWithoutState extends OrderWithoutIdAndState {
  @MaxLength(24)
  _id!: string;
}
