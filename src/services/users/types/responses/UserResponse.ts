import { MaxLength } from "class-validator";
import { ExpectAnyValueInResponseInTests } from "../../../../backk/decorators/typeproperty/testing/ExpectAnyValueInResponseInTests";
import User from "../entities/User";

export default class UserResponse extends User {
  @MaxLength(16)
  @ExpectAnyValueInResponseInTests()
  extraInfo!: string;
}
