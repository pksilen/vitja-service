import { ArrayMaxSize, IsEmail, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import UniqueIndex from "../../../../backk/decorators/entity/UniqueIndex";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import { IsExprTrue } from "../../../../backk/decorators/typeproperty/IsExprTrue";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";
import _Id from "../../../../backk/types/id/_Id";
import LengthAndMatchesAll from "../../../../backk/decorators/typeproperty/LengthOrMatchesAll";
import { Private } from "../../../../backk/decorators/service/function/Private";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";

@Entity()
@UniqueIndex(['userName'])
export default class User extends _Id {
  @Unique()
  @MaxLength(512)
  @IsEmail()
  @TestValue('test@test.com')
  userName!: string;

  isBusinessUser!: boolean;

  @Private()
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
  streetAddress!: string;

  @MaxLength(32)
  postalCode!: string;

  @MaxLength(256)
  city!: string;

  loyaltyDiscountLevel!: 0 | 25 | 50;

  defaultPaymentMethod!: DefaultPaymentMethod | null;

  @ArrayMaxSize(10)
  paymentMethods!: PaymentMethod[];

  @TestValue('123')
  @ArrayMaxSize(100)
  favoriteSalesItemIds!: string[];
}
