import UserWithoutIdAndPassword from "./UserWithoutIdAndPassword";
import { Matches, MaxLength } from "class-validator";
import { ValueUsedInTests } from "../../../../backk/ValueUsedInTests";

export default class UserWithoutId extends UserWithoutIdAndPassword {
  @MaxLength(512)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @ValueUsedInTests('Jepulis0!')
  password!: string;
}
