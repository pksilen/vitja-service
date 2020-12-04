// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsEmail, IsString, MaxLength } from 'class-validator';
import { Documentation } from '../../../../backk/decorators/typeproperty/Documentation';
import { IsExprTrue } from '../../../../backk/decorators/typeproperty/IsExprTrue';
import LengthAndMatchesAll from '../../../../backk/decorators/typeproperty/LengthOrMatchesAll';
import { TestValue } from '../../../../backk/decorators/typeproperty/testing/TestValue';
import { Unique } from '../../../../backk/decorators/typeproperty/Unique';
import DefaultPaymentMethod from '../entities/DefaultPaymentMethod';
import PaymentMethod from '../entities/PaymentMethod';

export default class CreateUserArg {
  @Unique()
  @MaxLength(512)
  @IsEmail()
  @TestValue('test@test.com')
  public userName!: string;

  public isBusinessUser!: boolean;

  @Documentation('Password doc goes here...')
  @IsExprTrue(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @IsExprTrue(
    ({ password, userName }) => (userName ? !password.toLowerCase().includes(userName.toLowerCase()) : true),
    'Password may not contain username'
  )
  @LengthAndMatchesAll(8, 512, [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/])
  @TestValue('Jepulis0!')
  password!: string;

  @MaxLength(512)
  public streetAddress!: string;

  @MaxLength(32)
  public postalCode!: string;

  @MaxLength(256)
  public city!: string;

  public readonly loyaltyDiscountLevel!: 0 | 25 | 50;

  public defaultPaymentMethod!: DefaultPaymentMethod | null;

  @ArrayMaxSize(10)
  public paymentMethods!: PaymentMethod[];

  @TestValue('123')
  @ArrayMaxSize(100)
  public favoriteSalesItemIds!: string[];

  @IsString()
  @MaxLength(512)
  captchaToken!: string;
}
