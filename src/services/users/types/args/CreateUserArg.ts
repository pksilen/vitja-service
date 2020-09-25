import { Matches, MaxLength } from "class-validator";
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import UserWithoutIdAndPassword from "../base/UserWithoutIdAndPassword";

export default class CreateUserArg extends UserWithoutIdAndPassword {
  @MaxLength(512)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @ValueUsedInTests('Jepulis0!')
  password!: string;
}
