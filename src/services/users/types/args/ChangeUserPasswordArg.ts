// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsEmail, IsString, MaxLength } from 'class-validator';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/decorators/typeproperty/IsExprTrue';
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import LengthAndMatchesAll from '../../../../backk/decorators/typeproperty/LengthOrMatchesAll';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { TestValue } from '../../../../backk/decorators/typeproperty/testing/TestValue';
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';

export default class ChangeUserPasswordArg {
  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsString({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]+$/, {
    groups: ['__backk_update__']
  })
  _id!: string;

  @Unique()
  @MaxLength(512)
  @IsEmail()
  @TestValue('test@test.com')
  userName!: string;

  @Documentation('Password doc goes here...')
  @IsExprTrue(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @IsExprTrue(
    ({ password, userName }) => !password.toLowerCase().includes(userName.toLowerCase()),
    'Password may not contain username'
  )
  @LengthAndMatchesAll(8, 512, [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/])
  @TestValue('Jepulis0!')
  password!: string;

  @LengthAndMatchesAll(8, 512, [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/])
  @TestValue('Jepulis0!')
  currentPassword!: string;
}
