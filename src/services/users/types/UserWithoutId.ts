import { Matches, MaxLength } from "class-validator";
import { UseTestValue } from '../../../backk/UseTestValue';
import UserWithoutIdAndPassword from "./UserWithoutIdAndPassword";

export default class UserWithoutId extends UserWithoutIdAndPassword {
  @MaxLength(512)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @UseTestValue('Jepulis0!')
  password!: string;
}
