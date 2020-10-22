// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import { ValueUsedInTests } from '../../../../backk/decorators/typeproperty/testing/ValueUsedInTests';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';

export default class UpdateUserArg {
  @Documentation('Password doc goes here...')
  @MaxLength(512)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
  @ValueUsedInTests('Jepulis0!')
  @IsOptional()
  password!: string;

  @MaxLength(512)
  @IsOptional()
  streetAddress!: string;

  @MaxLength(32)
  @IsOptional()
  postalCode!: string;

  @MaxLength(256)
  @IsOptional()
  city!: string;

  @IsOptional()
  defaultPaymentMethod!: DefaultPaymentMethod;

  @IsOptional()
  paymentMethods!: PaymentMethod[];

  @MaxLength(24, {
    each: true
  })
  @ValueUsedInTests('123')
  @IsOptional()
  favoriteSalesItemIds!: string[];

  @IsString()
  @MaxLength(24)
  _id!: string;
}
