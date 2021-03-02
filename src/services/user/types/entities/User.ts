// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../../backk/decorators/entity/Entity";
import PaymentMethod from "../../../useraccount/types/entities/PaymentMethod";
import Order from "../../../order/types/entities/Order";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../../useraccount/validation/getCities";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import BaseUserAccount from "../../../../backk/types/useraccount/BaseUserAccount";
import FavoriteSalesItem from "../../../salesitem/types/entities/FavoriteSalesItem";
import OwnSalesItem from "../../../salesitem/types/entities/OwnSalesItem";
import FollowedUser from "../../../useraccount/types/entities/FollowedUser";
import FollowingUser from "../../../useraccount/types/entities/FollowingUser";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";
import _Id from "../../../../backk/types/id/_Id";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import { ArrayMaxSize, ArrayMinSize, IsPhoneNumber, MaxLength, IsEmail, IsString, IsAscii } from "class-validator"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"
import { Lengths } from "../../../../backk/constants/constants"
import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor"
import { OneToMany } from "../../../../backk/decorators/typeproperty/OneToMany"
import { Unique } from "../../../../backk/decorators/typeproperty/Unique"
import { Private } from "../../../../backk/decorators/typeproperty/Private"
import { Transient } from "../../../../backk/decorators/typeproperty/Transient"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"

@Entity('UserAccount')
export default class User {
  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsStringOrObjectId({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, {
    groups: ['__backk_update__']
  })
  public _id!: string;

  @IsString()
  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @MaxLength(Lengths._256)
  @IsOneOf(getCities, 'userAccountsService.getCities', 'Tampere')
  public city!: string;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public imageDataUri!: string;

  @OneToMany(true)
  public readonly ownSalesItems!: OwnSalesItem[];

  @ManyToMany()
  public readonly followedUsers!: FollowedUser[];

  @ManyToMany()
  public readonly followingUsers!: FollowingUser[];

}