import _IdAndCaptcha from '../id/_IdAndCaptcha';
import { Unique } from '../../decorators/typeproperty/Unique';
import { IsEmail, MaxLength } from 'class-validator';
import { Lengths } from '../../constants/constants';
import IsAnyString from '../../decorators/typeproperty/IsAnyString';
import IsStrongPassword from '../../decorators/typeproperty/IsStrongPassword';

export default class BaseUserAccount extends _IdAndCaptcha {
  @Unique()
  @IsEmail()
  /* private */
  userName!: string;

  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @IsStrongPassword()
  /* private */
  password!: string;
}
