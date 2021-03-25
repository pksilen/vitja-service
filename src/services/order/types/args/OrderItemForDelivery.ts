// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import ShoppingCartOrOrderSalesItem from "../../../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";
import { ArrayMaxSize, ArrayMinSize, IsUrl, MaxLength } from "class-validator"
import { OrderItemState } from "../enum/OrderItemState"
import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor"
import { Lengths } from "../../../../backk/constants/constants"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"

import OrderItem from '../entities/OrderItem';

export default class OrderItemForDelivery {
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  public id!: string;

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