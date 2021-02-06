import { MaxLength } from "class-validator";
import IsAnyString from "../decorators/typeproperty/IsAnyString";

export class Name {
  @MaxLength(1024)
  @IsAnyString()
  name!: string;
}
