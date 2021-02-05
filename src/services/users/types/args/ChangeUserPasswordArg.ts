// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsEmail, MaxLength } from 'class-validator';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import LengthAndMatchesAll from '../../../../backk/decorators/typeproperty/LengthOrMatchesAll';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { ShouldBeTrueForEntity } from '../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity';
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';

export default class ChangeUserPasswordArg {
  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsStringOrObjectId({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, {
    groups: ['__backk_update__']
  })
  public _id!: string;

  @Unique()
  @MaxLength(512)
  @IsEmail()
  userName!: string;

  @Documentation('Password doc goes here...')
  @ShouldBeTrueForEntity(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @ShouldBeTrueForEntity(
    ({ password, userName }) => !password.toLowerCase().includes(userName.toLowerCase()),
    'Password may not contain username'
  )
  @LengthAndMatchesAll(8, 512, [/[a-z]+/, /[A-Z]+/, /\d+/, /[^\w\s]+/])
  password!: string;

  @LengthAndMatchesAll(8, 512, [/[a-z]+/, /[A-Z]+/, /\d+/, /[^\w\s]+/])
  currentPassword!: string;
}
