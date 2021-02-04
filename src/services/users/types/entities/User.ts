import { ArrayMaxSize, IsEmail, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";
import LengthAndMatchesAll from "../../../../backk/decorators/typeproperty/LengthOrMatchesAll";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import { SalesItem } from "../../../salesitems/types/entities/SalesItem";
import Order from "../../../orders/types/entities/Order";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import FollowedUser from "./FollowedUser";
import FollowingUser from "./FollowingUser";

@Entity()
export default class User extends _IdAndCaptcha {
  @Unique()
  @MaxLength(512)
  @IsEmail()
  @TestValue('test@test.com')
  userName!: string;

  @MaxLength(512)
  public displayName!: string;

  public isBusinessUser!: boolean;

  @Documentation('Password doc goes here...')
  @ShouldBeTrueForEntity(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @ShouldBeTrueForEntity(
    ({ password, userName }) => (!password.toLowerCase().includes(userName.toLowerCase())),
    'Password may not contain username'
  )
  @LengthAndMatchesAll(8, 512, [/[a-z]+/, /[A-Z]+/, /\d+/, /[^\w\s]+/])
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

  @ArrayMaxSize(100)
  public favoriteSalesItemIds!: string[];

  public readonly salesItems!: SalesItem[];

  public readonly orders!: Order[];

  @ManyToMany()
  public readonly followedUsers!: FollowedUser[];

  @ManyToMany()
  public readonly followingUsers!: FollowingUser[];
}
