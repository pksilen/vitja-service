import OrderCreateDto from "./OrderCreateDto";
import { MaxLength } from "class-validator";

export default class OrderUpdateDto extends OrderCreateDto {
  @MaxLength(24)
  _id!: string;
}
