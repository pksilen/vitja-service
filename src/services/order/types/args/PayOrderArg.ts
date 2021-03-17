// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsAlphanumeric, MaxLength } from 'class-validator';
import { Lengths, Values } from '../../../../backk/constants/constants';
import { IsExternalId } from '../../../../backk/decorators/typeproperty/IsExternalId';
import { IsFloat } from '../../../../backk/decorators/typeproperty/IsFloat';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId';
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';
import { PaymentGateway } from '../enum/PaymentGateway';

export default class PayOrderArg {
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

  public paymentGateway: PaymentGateway = 'Paytrail';

  @MaxLength(Lengths._256)
  @IsAlphanumeric()
  @IsExternalId()
  public transactionId!: string | null;

  public transactionTimestamp!: Date | null;

  @IsFloat(2)
  @MinMax(0, Values._1B)
  public paymentAmount!: number | null;

  shoppingCartId!: string;
}
