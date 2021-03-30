// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, ArrayMinSize, IsString, Max, MaxLength, Min } from 'class-validator';
import IsBigInt from '../../../../backk/decorators/typeproperty/IsBigInt'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId';
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import OrderItemForDelivery from './OrderItemForDelivery';

export default class DeliverOrderItemArg {
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

  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  orderItems!: OrderItemForDelivery[];
}
