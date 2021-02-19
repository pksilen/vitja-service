import { MaxLength } from "class-validator";
import User from "../entities/User";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import { Lengths } from "../../../../backk/constants/constants";

export default class UserResponse extends User {
  @MaxLength(Lengths._16)
  @IsAnyString()
  @TestValue('Some extra info')
  public extraInfo!: string;
}
