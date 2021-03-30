// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsString, Max, MaxLength, Min } from 'class-validator';
import { Values } from '../../../../backk/constants/constants';
import IsBigInt from '../../../../backk/decorators/typeproperty/IsBigInt'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
// eslint-disable-next-line @typescript-eslint/class-name-casing
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';

export default class RemoveOrderItemArg {
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
  @MaxLength(24, {
    groups: ['__backk_none__']
  })
  @IsBigInt({
    groups: ['__backk_none__']
  })
  @Min(-1)
  @Max(Number.MAX_SAFE_INTEGER)
  public version!: number;

  orderItemId!: string;

  @Unique()
  @IsStringOrObjectId()
  @MaxLengthAndMatches(Values._24, /^[a-f\d]{1,24}$/)
  userAccountId!: string;
}
