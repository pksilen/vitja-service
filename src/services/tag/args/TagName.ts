// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { Lengths } from '../../../backk/constants/constants';
import IsAnyString from '../../../backk/decorators/typeproperty/IsAnyString';
import { Unique } from '../../../backk/decorators/typeproperty/Unique';

export default class TagName {
  @MaxLength(Lengths._64)
  @IsAnyString()
  @Unique()
  public name!: string;
}
