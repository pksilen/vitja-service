// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsEmail, MaxLength } from 'class-validator';
import { Private } from '../../../../backk/decorators/service/function/Private';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/decorators/typeproperty/IsExprTrue';
import LengthAndMatchesAll from '../../../../backk/decorators/typeproperty/LengthOrMatchesAll';
import { ValueUsedInTests } from '../../../../backk/decorators/typeproperty/testing/ValueUsedInTests';

export default class ChangeUserPasswordArg {
  _id!: string;

  @MaxLength(512)
  @IsEmail()
  @ValueUsedInTests('test@test.com')
  userName!: string;

  @Private()
  @Documentation('Password doc goes here...')
  @IsExprTrue(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @IsExprTrue(
    ({ password, userName }) => (userName ? !password.toLowerCase().includes(userName.toLowerCase()) : true),
    'Password may not contain username'
  )
  @LengthAndMatchesAll(8, 512, [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/])
  @ValueUsedInTests('Jepulis0!')
  password!: string;

  @MaxLength(512)
  @ValueUsedInTests('Jepulis0!')
  currentPassword!: string;
}
