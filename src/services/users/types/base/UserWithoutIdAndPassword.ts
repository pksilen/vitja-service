import { MaxLength } from "class-validator";
import UserWithoutIdAndPasswordAndUserName from "./UserWithoutIdAndPasswordAndUserName";

export default class UserWithoutIdAndPassword extends UserWithoutIdAndPasswordAndUserName{
  @MaxLength(512)
  userName!: string;
}
