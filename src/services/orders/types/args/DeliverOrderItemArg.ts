// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsUrl, MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import Id from '../../../../backk/types/id/Id';
import { OrderState } from '../enum/OrderState';
import { ShouldBeTrueForEntity } from '../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity';
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";


export default class DeliverOrderItemArg {
  orderId!: string;

  orderItemId!: string;

  @ShouldBeTrueForEntity(({
    state,
    deliveryTimestamp
  }) => state === 'toBeDelivered' && deliveryTimestamp === null || state !== 'toBeDelivered' && deliveryTimestamp !== null)
  public deliveryTimestamp!: Date | null;

  @MaxLength(4096)
  @IsUrl()
  @ShouldBeTrueForEntity(({
    state,
    trackingUrl
  }) => state === 'toBeDelivered' && trackingUrl === null || state !== 'toBeDelivered' && trackingUrl !== null)
  public trackingUrl!: string | null;

}