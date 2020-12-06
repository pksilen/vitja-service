// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsString } from 'class-validator';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { SalesItemState } from '../enums/SalesItemState';

export default class UpdateSalesItemStateArg {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  readonly _id!: string;

  public readonly state!: SalesItemState;
}
