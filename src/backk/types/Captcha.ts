import { IsString, MaxLength } from "class-validator";

export default class Captcha {
  @IsString()
  @MaxLength(512)
  public captchaToken!: string;
}
