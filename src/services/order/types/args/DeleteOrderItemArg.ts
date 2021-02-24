// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsString, MaxLength } from 'class-validator';
import IsIntegerStringOrAny from '../../../../backk/decorators/typeproperty/IsIntegerStringOrAny'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
// eslint-disable-next-line @typescript-eslint/class-name-casing
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';

export default class DeleteOrderItemArg {
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

  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsString({
    groups: ['__backk_none__']
  })
  @MaxLength(25, {
    groups: ['__backk_none__']
  })
  @IsIntegerStringOrAny({
    groups: ['__backk_none__']
  })
  public version!: string;

  orderItemId!: string;

  @Unique()
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  userAccountId!: string;
}