// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsCreditCard, MaxLength } from "class-validator";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsCreditCardExpiration from "../../../../backk/decorators/typeproperty/IsCreditCardExpiration";
import IsCardVerificationCode from "../../../../backk/decorators/typeproperty/isCardVerificationCode";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";

import Entity from '../../../../backk/decorators/entity/Entity';
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