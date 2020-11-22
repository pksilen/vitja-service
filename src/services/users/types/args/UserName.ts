// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsEmail, MaxLength } from 'class-validator';
import { TestValue } from '../../../../backk/decorators/typeproperty/testing/TestValue';

export default class UserName {
  @MaxLength(512)
  @IsEmail()
  @TestValue('test@test.com')
  userName!: string;
}
