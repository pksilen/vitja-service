// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { Matches, MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import UniqueIndex from '../../../../backk/annotations/entity/UniqueIndex';
import { Documentation } from '../../../../backk/annotations/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/annotations/typeproperty/IsExprTrue';
import { ValueUsedInTests } from '../../../../backk/ValueUsedInTests';
import DefaultPaymentMethod from "../entities/DefaultPaymentMethod";
import PaymentMethod from "../entities/PaymentMethod";

import { Captcha } from "../../../../backk/Backk";

export default class CreateUserArg {
@MaxLength(512)
@IsExprTrue('obj.password && obj.password.length >= 8 || true')
userName!: string;

@Documentation('Password doc goes here...')
@MaxLength(512)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/)
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
