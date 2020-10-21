// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';

export default class DeleteOrderItemArg {
  @MaxLength(24)
  orderId!: string;

  @MaxLength(24)
  orderItemId!: string;

  @MaxLength(24)
  userId!: string;
}
