import OrderWithoutIdAndCreatedTimestampAndState from "./OrderWithoutIdAndCreatedTimestampAndState";
import { MaxLength } from "class-validator";

export default class OrderWithoutCreatedTimestampAndState extends OrderWithoutIdAndCreatedTimestampAndState {
  @MaxLength(24)
  _id!: string;
}
