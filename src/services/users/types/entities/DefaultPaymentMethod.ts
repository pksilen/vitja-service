// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsCreditCard, MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { ValueUsedInTests } from '../../../../backk/decorators/typeproperty/testing/ValueUsedInTests';

@Entity()
export default class DefaultPaymentMethod {
  paymentMethodType!: 'creditCard';

  @IsCreditCard()
  @MaxLength(19)
  @ValueUsedInTests('4111 1111 1111 1111')
  creditCardNumber!: string;

  @MaxLengthAndMatches(5, /^(0[1-9]|1[0-2])\/([0-9]{2})$/)
  @ValueUsedInTests('11/21')
  creditCardExpiration!: string;

  @MaxLengthAndMatches(4, /^[0-9]{3,4}$/)
  @ValueUsedInTests('345')
  cardVerificationCode!: string;
}
