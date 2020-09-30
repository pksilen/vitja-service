
import UserWithoutIdAndPasswordAndUserName from "../base/UserWithoutIdAndPasswordAndUserName";
import { Matches, MaxLength } from "class-validator";
import { ValueUsedInTests } from "../../../../backk/ValueUsedInTests";

export default class UpdateUserArg extends UserWithoutIdAndPasswordAndUserName {
  @MaxLength(24)
  _id!: string;
  
  @MaxLength(512)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @ValueUsedInTests('Jepulis0!')
  password!: string;
}
