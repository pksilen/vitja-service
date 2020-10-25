// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength, MinLength } from 'class-validator';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/decorators/typeproperty/IsExprTrue';
import MaxLengthAndMatchesAll from '../../../../backk/decorators/typeproperty/MaxLengthAndMatchesAll';
import { ValueUsedInTests } from '../../../../backk/decorators/typeproperty/testing/ValueUsedInTests';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';

export default class CreateUserArg {
  @MaxLength(512)
  userName!: string;

  @Documentation('Password doc goes here...')
  @IsExprTrue(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @IsExprTrue(
    ({ password, userName }) => (userName ? !password.toLowerCase().includes(userName.toLowerCase()) : true),
    'Password may not contain username'
  )
  @MinLength(8)
  @MaxLengthAndMatchesAll(512, [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/])
  @ValueUsedInTests('Jepulis0!')
  password!: string;

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

  @MaxLength(512)
  captchaToken!: string;
}
