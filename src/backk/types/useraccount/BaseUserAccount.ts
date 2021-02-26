import _IdAndCaptcha from '../id/_IdAndCaptcha';
import { Unique } from '../../decorators/typeproperty/Unique';
import { IsEmail, MaxLength } from 'class-validator';
import { Lengths } from '../../constants/constants';
import IsAnyString from '../../decorators/typeproperty/IsAnyString';
import IsStrongPassword from '../../decorators/typeproperty/IsStrongPassword';
import { Private } from "../../decorators/typeproperty/Private";

export default class BaseUserAccount extends _IdAndCaptcha {
  @Unique()
  @IsEmail()
  @Private()
  userName!: string;

  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @IsStrongPassword()
  @Private()
  password!: string;
}
