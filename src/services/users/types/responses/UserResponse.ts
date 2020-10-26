import { MaxLength } from "class-validator";
import { ExpectAnyValueInTests } from "../../../../backk/decorators/typeproperty/testing/ExpectAnyValueInTests";
import User from "../entities/User";

export default class UserResponse extends User {
  @MaxLength(16)
  @ExpectAnyValueInTests()
  extraInfo!: string;
}
