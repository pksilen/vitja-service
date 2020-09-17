import SalesItemWithoutIdAndCreatedTimestampAndState from "./SalesItemWithoutIdAndCreatedTimestampAndState";
import { MaxLength } from "class-validator";

export default class SalesItemWithoutCreatedTimestampAndState extends SalesItemWithoutIdAndCreatedTimestampAndState {
  @MaxLength(24)
  _id!: string;
}
