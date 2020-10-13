// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { Matches, MaxLength } from 'class-validator';
import { IsOptional } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import UniqueIndex from '../../../../backk/annotations/entity/UniqueIndex';
import { Documentation } from '../../../../backk/annotations/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/annotations/typeproperty/IsExprTrue';
import { Id } from '../../../../backk/Backk';
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import DefaultPaymentMethod from "../entities/DefaultPaymentMethod";
import PaymentMethod from "../entities/PaymentMethod";

export default class UpdateUserArg {
@MaxLength(24)
_id!: string;

@IsOptional()
@Documentation('Password doc goes here...')
@MaxLength(512)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
@ValueUsedInTests('Jepulis0!')
password!: string;

@IsOptional()
@MaxLength(512)
streetAddress!: string;

@IsOptional()
@MaxLength(32)
postalCode!: string;

@IsOptional()
@MaxLength(256)
city!: string;

@IsOptional()
loyaltyDiscountLevel!: 0 | 25 | 50;

@IsOptional()
defaultPaymentMethod!: DefaultPaymentMethod;

@IsOptional()
paymentMethods!: PaymentMethod[];

@IsOptional()
@MaxLength(24, {
  each: true
})
@ValueUsedInTests('123')
favoriteSalesItemIds!: string[];

}
