import { MaxLength } from "class-validator";
import UserWithoutId from "../base/UserWithoutId";
import { Captcha } from "../../../../backk/Backk";

export default class CreateUserArg extends UserWithoutId implements Captcha {
  @MaxLength(512)
  captcha_token!: string;
}
