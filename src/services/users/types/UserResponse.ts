import { ExpectAnyValueInTests } from "../../../backk/ExpectAnyValueInTests";
import UserWithoutIdAndPassword from "./UserWithoutIdAndPassword";
import { MaxLength } from "class-validator";

export default class UserResponse extends UserWithoutIdAndPassword {
  @MaxLength(24)
  _id!: string;

  @MaxLength(16)
  @ExpectAnyValueInTests()
  extraInfo!: string;
}
