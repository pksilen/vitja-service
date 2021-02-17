import { ArrayMaxSize, IsEmail, IsPhoneNumber, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import PaymentMethod from "./PaymentMethod";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import { SalesItem } from "../../../salesitems/types/entities/SalesItem";
import Order from "../../../orders/types/entities/Order";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../validation/getCities";
import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import { Lengths } from "../../../../backk/constants/constants";
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
import FavoriteSalesItem from "./FavoriteSalesItem";
import PublicUser from "./PublicUser";

@Entity()
export default class User extends _IdAndCaptcha {
  @Unique()
  @IsEmail()
  userName!: string;

  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  public isBusinessUser!: boolean;

  @Documentation('Password doc goes here...')
  @IsStrongPassword()
  password!: string;

  @MaxLength(Lengths._512)
  @IsAnyString()
  public streetAddress!: string;

  @IsPostalCode('FI')
  public postalCode!: string;

  @MaxLength(Lengths._256)
  @IsOneOf(getCities, 'usersService.getCities', 'Tampere')
  public city!: string;

  @IsPhoneNumber('FI')
  public phoneNumber!: string;

  public readonly commissionDiscountPercentage!: 0 | 25 | 50;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public imageDataUri!: string;

  @ArrayMaxSize(10)
  @ShouldBeTrueForEntity<User>(
    ({ paymentMethods }) => paymentMethods.filter(({ isDefault }) => isDefault).length === 1,
    'There should be one default payment method'
  )
  public paymentMethods!: PaymentMethod[];

  @ManyToMany()
  @ArrayMaxSize(100)
  public favoriteSalesItems!: FavoriteSalesItem[];

  public readonly salesItems!: SalesItem[];

  public readonly orders!: Order[];

  @ManyToMany()
  public readonly followedUsers!: PublicUser[];

  @ManyToMany()
  public readonly followingUsers!: PublicUser[];
}
