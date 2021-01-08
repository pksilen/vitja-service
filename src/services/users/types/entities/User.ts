import { ArrayMaxSize, IsEmail, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import { IsExprTrue } from "../../../../backk/decorators/typeproperty/IsExprTrue";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";
import LengthAndMatchesAll from "../../../../backk/decorators/typeproperty/LengthOrMatchesAll";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import { SalesItem } from "../../../salesitems/types/entities/SalesItem";

@Entity()
export default class User extends _IdAndCaptcha {
  @Unique()
  @MaxLength(512)
  @IsEmail()
  @TestValue('test@test.com')
  userName!: string;

  public isBusinessUser!: boolean;

  @Documentation('Password doc goes here...')
  @IsExprTrue(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @IsExprTrue(
    ({ password, userName }) => (!password.toLowerCase().includes(userName.toLowerCase())),
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

  public readonly commissionDiscountPercentage!: 0 | 25 | 50;

  public defaultPaymentMethod!: DefaultPaymentMethod | null;

  @ArrayMaxSize(10)
  public paymentMethods!: PaymentMethod[];

  @TestValue('123')
  @ArrayMaxSize(100)
  public favoriteSalesItemIds!: string[];

  public readonly salesItems!: SalesItem[];
}
