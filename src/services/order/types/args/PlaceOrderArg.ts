// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "../entities/OrderItem";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _IdAndVersionAndCreatedAtTimestamp from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestamp";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _Id from "../../../../backk/types/id/_Id";
import IsIntegerStringOrAny from "../../../../backk/decorators/typeproperty/IsIntegerStringOrAny"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import { ArrayMaxSize, ArrayMinSize, IsAlphanumeric, MaxLength, IsDate, IsString } from "class-validator"
import { Lengths, Values } from "../../../../backk/constants/constants"
import { OneToMany } from "../../../../backk/decorators/typeproperty/OneToMany"
import { PaymentGateway } from "../enum/PaymentGateway"
import { IsExternalId } from "../../../../backk/decorators/typeproperty/IsExternalId"
import { IsFloat } from "../../../../backk/decorators/typeproperty/IsFloat"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"

import ShoppingCart from "../../../shoppingcart/types/entities/ShoppingCart";
import { IsUrl, MaxLength } from "class-validator";
import { Lengths } from "../../../../backk/constants/constants";

export default class PlaceOrderArg {
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  public userAccountId!: string;

  public paymentGateway: PaymentGateway = 'Paytrail';

  @MaxLength(Lengths._4K)
  @IsUrl()
  uiRedirectUrl!: string;

}