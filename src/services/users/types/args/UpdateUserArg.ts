// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsString, MaxLength } from 'class-validator';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/decorators/typeproperty/IsExprTrue';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { ValueUsedInTests } from '../../../../backk/decorators/typeproperty/testing/ValueUsedInTests';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';

export default class UpdateUserArg {
  @Documentation('Password doc goes here...')
  @IsExprTrue(({ password }) => !password.includes('password'), 'Password may not contain word "password"')
  @IsExprTrue(({ password, userName }) => !password.includes(userName), 'Password may not contain username')
  @MaxLengthAndMatches(512, /^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{8,}$/)
  @ValueUsedInTests('Jepulis0!')
  password?: string;

  @MaxLength(512)
  streetAddress?: string;

  @MaxLength(32)
  postalCode?: string;

  @MaxLength(256)
  city?: string;

  defaultPaymentMethod?: DefaultPaymentMethod;

  paymentMethods?: PaymentMethod[];

  @MaxLength(24, {
    each: true
  })
  @ValueUsedInTests('123')
  favoriteSalesItemIds?: string[];

  @IsString()
  @MaxLength(24)
  _id!: string;
}
