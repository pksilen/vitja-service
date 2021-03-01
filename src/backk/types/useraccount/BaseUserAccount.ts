import _IdAndCaptcha from '../id/_IdAndCaptcha';
import { Unique } from '../../decorators/typeproperty/Unique';
import { IsEmail, IsString, MaxLength } from "class-validator";
import { Lengths } from '../../constants/constants';
import IsAnyString from '../../decorators/typeproperty/IsAnyString';
import IsStrongPassword from '../../decorators/typeproperty/IsStrongPassword';
import { Private } from "../../decorators/typeproperty/Private";

export default class BaseUserAccount extends _IdAndCaptcha {
  @Unique()
  @IsString()
  @IsEmail()
  @Private()
  userName!: string;

  @IsString()
  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @IsString()
  @IsStrongPassword()
  @Private()
  password!: string;
}
