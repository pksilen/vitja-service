import { MaxLength } from "class-validator";
import User from "../entities/User";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";

export default class UserResponse extends User {
  @MaxLength(16)
  @IsAnyString()
  @TestValue('Some extra info')
  extraInfo!: string;
}
