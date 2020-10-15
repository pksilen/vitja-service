// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { IsExprTrue } from '../../../../backk/annotations/typeproperty/IsExprTrue';

export default class UserName {
  @MaxLength(512)
  @IsExprTrue('obj.password && obj.password.length >= 8 || true')
  userName!: string;
}
