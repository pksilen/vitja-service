// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { OptPostQueryOps } from '../../../../backk/Backk';


export default class GetByUserIdArg extends OptPostQueryOps {
  @MaxLength(24)
  userId!: string;
}
