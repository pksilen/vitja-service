import { IsEmail } from "class-validator";

export default class UserName {
  @IsEmail()
  userName!: string;
}
