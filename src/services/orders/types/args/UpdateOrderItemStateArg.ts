// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

export default class UpdateOrderItemStateArg {
  orderId!: string;

  orderItemId!: string;

  newState!: 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned';
}
