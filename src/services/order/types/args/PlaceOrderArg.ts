// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

// eslint-disable-next-line @typescript-eslint/class-name-casing
import { IsUrl, MaxLength } from 'class-validator';
import { Lengths, Values } from '../../../../backk/constants/constants';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';
import { PaymentGateway } from '../enum/PaymentGateway';

export default class PlaceOrderArg {
  @Unique()
  @IsStringOrObjectId()
  @MaxLengthAndMatches(Values._24, /^[a-f\d]{1,24}$/)
  userAccountId!: string;

  public paymentGateway: PaymentGateway = 'Paytrail';

  shoppingCartId!: string;

  @MaxLength(Lengths._4K)
  @IsUrl()
  uiRedirectUrl!: string;
}
