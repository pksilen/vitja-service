// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsUrl, MaxLength } from 'class-validator';
import { Lengths } from '../../../../backk/constants/constants';
import ShoppingCart from '../../../shoppingcart/types/entities/ShoppingCart';
import { PaymentGateway } from '../enum/PaymentGateway';

export default class PlaceOrderArg {
  public paymentGateway: PaymentGateway = 'Paytrail';

  shoppingCart!: ShoppingCart;

  @MaxLength(Lengths._4K)
  @IsUrl()
  uiRedirectUrl!: string;
}
