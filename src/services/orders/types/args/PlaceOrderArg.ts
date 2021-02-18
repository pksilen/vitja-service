// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsAlphanumeric, IsNumber, MaxLength } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import Entity from "../../../../backk/decorators/entity/Entity";
import { IsExternalId } from "../../../../backk/decorators/typeproperty/IsExternalId";
import { Lengths, Values } from "../../../../backk/constants/constants";
import { PaymentGateway } from "../enum/PaymentGateway";

import ShoppingCart from "../../../shoppingcart/types/entities/ShoppingCart";
import { IsUrl, MaxLength } from "class-validator";
import { Lengths } from "../../../../backk/constants/constants";

export default class PlaceOrderArg {
  public paymentGateway: PaymentGateway = 'Paytrail';

  shoppingCart!: ShoppingCart;

  @MaxLength(Lengths._4K)
  @IsUrl()
  uiRedirectUrl!: string;

}