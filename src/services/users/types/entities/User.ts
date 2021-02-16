import { ArrayMaxSize, ArrayUnique, IsEmail, IsPhoneNumber, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import DefaultPaymentMethod from "./DefaultPaymentMethod";
import PaymentMethod from "./PaymentMethod";
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
import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";

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
  @IsStrongPassword()
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

  @MaxLength(10485760)
  @IsDataUri()
  public imageDataUri!: string;

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
