// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _Id from "../../../../backk/types/id/_Id";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import IsIntegerStringOrAny from "../../../../backk/decorators/typeproperty/IsIntegerStringOrAny"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import ShoppingCartOrOrderSalesItem from "../../../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";
import { IsString, MaxLength, ArrayMaxSize, ArrayMinSize, IsUrl } from "class-validator"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"
import { OrderState } from "../enum/OrderState"
import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor"
import { Lengths } from "../../../../backk/constants/constants"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"

import OrderItem from '../entities/OrderItem';

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
  @MaxLength(25, {
    groups: ['__backk_none__']
  })
  @IsIntegerStringOrAny({
    groups: ['__backk_none__']
  })
  public version!: string;

  orderItemId!: string;

  @ShouldBeTrueFor<OrderItem>(({
    state,
    deliveryTimestamp
  }) => state === 'toBeDelivered' && deliveryTimestamp === null || state !== 'toBeDelivered' && deliveryTimestamp !== null)
  public deliveryTimestamp!: Date | null;

  @MaxLength(Lengths._4K)
  @IsUrl()
  @ShouldBeTrueFor<OrderItem>(({
    state,
    trackingUrl
  }) => state === 'toBeDelivered' && trackingUrl === null || state !== 'toBeDelivered' && trackingUrl !== null)
  public trackingUrl!: string | null;

}