import { MaxLength } from "class-validator";
import UserAccount from "../entities/UserAccount";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import { Lengths } from "../../../../backk/constants/constants";

export default class UserAccountResponse extends UserAccount {
  @MaxLength(Lengths._16)
  @IsAnyString()
  @TestValue('Some extra info')
  public extraInfo!: string;
}
