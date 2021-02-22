import { ArrayMaxSize, ArrayMinSize, IsPhoneNumber, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import PaymentMethod from "./PaymentMethod";
import Order from "../../../order/types/entities/Order";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../validation/getCities";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import { Lengths } from "../../../../backk/constants/constants";
import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor";
import FavoriteSalesItem from "./FavoriteSalesItem";
import OwnSalesItem from "./OwnSalesItem";
import FollowUser from "./FollowUser";
import BaseUserAccount from "../../../../backk/types/useraccount/BaseUserAccount";
import { OneToMany } from "../../../../backk/decorators/typeproperty/OneToMany";

@Entity()
export default class UserAccount extends BaseUserAccount {
  public isBusinessUser!: boolean;

  @MaxLength(Lengths._512)
  @IsAnyString()
  public streetAddress!: string;

  @IsPostalCode('FI')
  public postalCode!: string;

  @MaxLength(Lengths._256)
  @IsOneOf(getCities, 'userAccountsService.getCities', 'Tampere')
  public city!: string;

  @IsPhoneNumber('FI')
  public phoneNumber!: string;

  public readonly commissionDiscountPercentage!: 0 | 25 | 50;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public imageDataUri!: string;

  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @OneToMany()
  @ShouldBeTrueFor<UserAccount>(
    ({ paymentMethods }) => paymentMethods.filter(({ isDefault }) => isDefault).length === 1,
    'There should be exactly one default payment method'
  )
  public paymentMethods!: PaymentMethod[];

  @ManyToMany()
  public readonly favoriteSalesItems!: FavoriteSalesItem[];

  @OneToMany(true)
  public readonly ownSalesItems!: OwnSalesItem[];

  @OneToMany(true)
  public readonly orders!: Order[];

  @ManyToMany()
  public readonly followedUsers!: FollowUser[];

  @ManyToMany()
  public readonly followingUsers!: FollowUser[];
}
