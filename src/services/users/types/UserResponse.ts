import { ExpectTestValueOfType } from "../../../backk/ExpectTestValueOfType";
import UserWithoutIdAndPassword from "./UserWithoutIdAndPassword";
import { MaxLength } from "class-validator";

export default class UserResponse extends UserWithoutIdAndPassword {
  @MaxLength(24)
  _id!: string;

  @MaxLength(16)
  @ExpectTestValueOfType('string')
  extraInfo!: string;
}
