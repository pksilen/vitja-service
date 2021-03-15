// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { OrderItemState } from '../enum/OrderItemState';

export default class OrderItemForStateUpdate {
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  public id!: string;

  public state!: OrderItemState;
}
