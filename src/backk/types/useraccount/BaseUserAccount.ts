import _IdAndCaptcha from "../id/_IdAndCaptcha";
import { Unique } from "../../decorators/typeproperty/Unique";
import { IsEmail, IsString, MaxLength } from "class-validator";
import { Lengths } from "../../constants/constants";
import IsAnyString from "../../decorators/typeproperty/IsAnyString";
import IsStrongPassword from "../../decorators/typeproperty/IsStrongPassword";
import { Private } from "../../decorators/typeproperty/Private";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

export default class BaseUserAccount extends _IdAndCaptcha {
  @IsUndefined({ groups: ['__backk_update__'] })
  @Unique()
  @IsString()
  @MaxLengthAndMatches(320 , /.*/)
  @IsEmail( )
  @Private()
  userName!: string;

  @IsString()
  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @IsUndefined({ groups: ['__backk_update__'] })
  @IsString({ groups: ['__backk_create__'] })
  @IsStrongPassword({ groups: ['__backk_create__'] })
  @Private()
  password!: string;
}
