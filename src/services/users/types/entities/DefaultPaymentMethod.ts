// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsCreditCard, MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import IsCardVerificationCode from '../../../../backk/decorators/typeproperty/isCardVerificationCode';
import IsCreditCardExpiration from '../../../../backk/decorators/typeproperty/IsCreditCardExpiration';

@Entity()
export default class DefaultPaymentMethod {
  public paymentMethodType!: 'creditCard';

  @IsCreditCard()
  @MaxLength(19)
  public creditCardNumber!: string;

  @MaxLength(7)
  @IsCreditCardExpiration()
  public creditCardExpiration!: string;

  @MaxLength(4)
  @IsCardVerificationCode()
  public cardVerificationCode!: string;
}
