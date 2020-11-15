// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsString, MaxLength } from 'class-validator';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import { ValueUsedInTests } from '../../../../backk/decorators/typeproperty/testing/ValueUsedInTests';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';

export default class UpdateUserArg {
  @MaxLength(512)
  streetAddress?: string;

  @MaxLength(32)
  postalCode?: string;

  @MaxLength(256)
  city?: string;

  defaultPaymentMethod?: DefaultPaymentMethod | null;

  paymentMethods?: PaymentMethod[];

  @ValueUsedInTests('123')
  favoriteSalesItemIds?: string[];

  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  _id!: string;
}
