// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { IsExprTrue } from '../../../../backk/annotations/type/IsExprTrue';
import { ExpectAnyValueInTests } from '../../../../backk/ExpectAnyValueInTests';
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';


export default class UserResponse {
  @MaxLength(24)
  _id!: string;

  @MaxLength(512)
  @IsExprTrue('obj.password && obj.password.length >= 8 || true')
  userName!: string;

  @MaxLength(512)
  streetAddress!: string;

  @MaxLength(32)
  postalCode!: string;

  @MaxLength(256)
  city!: string;

  loyaltyDiscountLevel!: 0 | 25 | 50;

  defaultPaymentMethod!: DefaultPaymentMethod;

  paymentMethods!: PaymentMethod[];

  @MaxLength(24, {
    each: true
  })
  @ValueUsedInTests('123')
  favoriteSalesItemIds!: string[];

  @MaxLength(16)
  @ExpectAnyValueInTests()
  extraInfo!: string;
}
