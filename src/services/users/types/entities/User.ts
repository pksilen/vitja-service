import { ArrayMaxSize, ArrayUnique, IsEmail, IsPhoneNumber, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
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
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../validation/getCities";

@Entity()
export default class User extends _IdAndCaptcha {
  @Unique()
  @IsEmail()
  userName!: string;

  @MaxLength(512)
  @IsAnyString()
  public displayName!: string;

  public isBusinessUser!: boolean;

  @Documentation('Password doc goes here...')
  @ShouldBeTrueForEntity(
    ({ password }) => !password.toLowerCase().includes('password'),
    'Password may not contain word password'
  )
  @ShouldBeTrueForEntity(
    ({ password, userName }) => !password.toLowerCase().includes(userName.toLowerCase()),
    'Password may not contain username'
  )
  @LengthAndMatchesAll(8, 512, [/[a-z]+/, /[A-Z]+/, /\d+/, /[^\w\s]+/])
  password!: string;

  @MaxLength(512)
  @IsAnyString()
  public streetAddress!: string;

  @IsPostalCode('FI')
  public postalCode!: string;

  @MaxLength(256)
  @IsOneOf(getCities, 'usersService.getCities', 'Tampere')
  public city!: string;

  @IsPhoneNumber('FI')
  public phoneNumber!: string;

  public readonly commissionDiscountPercentage!: 0 | 25 | 50;

  public defaultPaymentMethod!: DefaultPaymentMethod | null;

  @ArrayMaxSize(10)
  public paymentMethods!: PaymentMethod[];

  @ArrayMaxSize(100)
  @ArrayUnique()
  public favoriteSalesItemIds!: string[];

  public readonly salesItems!: SalesItem[];

  public readonly orders!: Order[];

  @ManyToMany()
  public readonly followedUsers!: FollowedUser[];

  @ManyToMany()
  public readonly followingUsers!: FollowingUser[];
}
