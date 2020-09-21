import SalesItemCreateDto from "./SalesItemCreateDto";
import { MaxLength } from "class-validator";

export default class SalesItemUpdateDto extends SalesItemCreateDto {
  @MaxLength(24)
  _id!: string;
}
