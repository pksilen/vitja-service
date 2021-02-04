import { IsAscii, IsString, MaxLength } from "class-validator";
import { Transient } from "../decorators/typeproperty/Transient";

export default class Captcha {
  @Transient()
  @IsString()
  @MaxLength(512)
  @IsAscii()
  captchaToken!: string;
}
