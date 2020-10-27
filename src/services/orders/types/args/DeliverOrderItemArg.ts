// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsInt, Max, MaxLength, Min } from 'class-validator';
import { MAX_INT_VALUE } from '../../../../backk/constants';
import { ExpectInTestsToEvaluateTrue } from '../../../../backk/decorators/typeproperty/testing/ExpectInTestsToEvaluateTrue';

export default class DeliverOrderItemArg {
  orderId!: string;

  orderItemId!: string;

  @IsInt()
  @Min(0)
  @Max(MAX_INT_VALUE)
  @ExpectInTestsToEvaluateTrue(
    ({ state, deliveryTimestampInSecs }) =>
      (state === 'toBeDelivered' && deliveryTimestampInSecs === 0) ||
      (state !== 'toBeDelivered' && deliveryTimestampInSecs !== 0)
  )
  deliveryTimestampInSecs!: number;

  @MaxLength(1024)
  @ExpectInTestsToEvaluateTrue(
    ({ state, trackingUrl }) =>
      (state === 'toBeDelivered' && trackingUrl === '') || (state !== 'toBeDelivered' && trackingUrl !== '')
  )
  trackingUrl!: string;
}
