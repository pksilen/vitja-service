import CreateSalesItemArg from "./CreateSalesItemArg";
import { MaxLength } from "class-validator";

export default class UpdateSalesItemArg extends CreateSalesItemArg {
  @MaxLength(24)
  _id!: string;
}
