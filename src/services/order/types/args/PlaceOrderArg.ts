// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsUrl, MaxLength } from 'class-validator';
import { Lengths } from '../../../../backk/constants/constants';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import { PaymentGateway } from '../enum/PaymentGateway';

export default class PlaceOrderArg {
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  public userAccountId!: string;

  public paymentGateway: PaymentGateway = 'Paytrail';

  @MaxLength(Lengths._4K)
  @IsUrl()
  uiRedirectUrl!: string;
}
