// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsString, MaxLength } from 'class-validator';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import { TestValue } from '../../../../backk/decorators/typeproperty/testing/TestValue';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';

export default class UpdateUserArg {
  isBusinessUser?: boolean;

  @MaxLength(512)
  streetAddress?: string;

  @MaxLength(32)
  postalCode?: string;

  @MaxLength(256)
  city?: string;

  defaultPaymentMethod?: DefaultPaymentMethod | null;

  @ArrayMaxSize(10)
  paymentMethods?: PaymentMethod[];

  @TestValue('123')
  @ArrayMaxSize(100)
  favoriteSalesItemIds?: string[];

  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  _id!: string;
}
