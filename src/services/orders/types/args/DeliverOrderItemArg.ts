// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { ExpectTrueForResponseInTests } from '../../../../backk/decorators/typeproperty/testing/ExpectTrueForResponseInTests';

export default class DeliverOrderItemArg {
  orderId!: string;

  orderItemId!: string;

  @ExpectTrueForResponseInTests(
    ({ state, deliveryTimestamp }) =>
      (state === 'toBeDelivered' && deliveryTimestamp === null) ||
      (state !== 'toBeDelivered' && deliveryTimestamp !== null)
  )
  public deliveryTimestamp!: Date | null;

  @MaxLength(1024)
  @ExpectTrueForResponseInTests(
    ({ state, trackingUrl }) =>
      (state === 'toBeDelivered' && trackingUrl === null) ||
      (state !== 'toBeDelivered' && trackingUrl !== null)
  )
  public trackingUrl!: string | null;
}
