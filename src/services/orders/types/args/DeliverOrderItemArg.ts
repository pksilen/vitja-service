// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsInt, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { Id } from '../../../../backk/Backk';
import { ExpectInTestsToMatch } from '../../../../backk/ExpectInTestsToMatch';

import OrderIdAndOrderItemId from './OrderIdAndOrderItemId';

export default class DeliverOrderItemArg extends OrderIdAndOrderItemId  {
@IsInt()
@Min(0)
@Max(2147483647)
@ExpectInTestsToMatch("state === 'toBeDelivered' && deliveryTimestampInSecs === 0 || state !== 'toBeDelivered' && deliveryTimestampInSecs !== 0")
deliveryTimestampInSecs!: number;

@MaxLength(1024)
@ExpectInTestsToMatch("state === 'toBeDelivered' && trackingUrl === '' || state !== 'toBeDelivered' && trackingUrl !== ''")
trackingUrl!: string;

}
