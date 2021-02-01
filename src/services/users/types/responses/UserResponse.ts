import { MaxLength } from "class-validator";
import User from "../entities/User";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class UserResponse extends User {
  @MaxLength(16)
  @TestValue('Some extra info')
  extraInfo!: string;
}
