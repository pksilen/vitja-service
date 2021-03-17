// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsEmail, IsString, MaxLength } from 'class-validator';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsStrongPassword from '../../../../backk/decorators/typeproperty/IsStrongPassword';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';

export default class ChangeUserPasswordArg {
  @IsStringOrObjectId({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, {
    groups: ['__backk_update__']
  })
  public _id!: string;

  @Unique()
  @IsString()
  @MaxLength(320)
  @IsEmail()
  public userName!: string;

  @IsString()
  @IsStrongPassword()
  public currentPassword!: string;

  @IsString()
  @IsStrongPassword()
  public newPassword!: string;

  @IsString()
  @IsStrongPassword()
  public repeatNewPassword!: string;
}
