// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../../backk/decorators/entity/Entity";
import PaymentMethod from "../../../useraccounts/types/entities/PaymentMethod";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import Order from "../../../orders/types/entities/Order";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../../useraccounts/validation/getCities";
import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import FavoriteSalesItem from "../../../useraccounts/types/entities/FavoriteSalesItem";
import OwnSalesItem from "../../../useraccounts/types/entities/OwnSalesItem";
import FollowUser from "../../../useraccounts/types/entities/FollowUser";
import _Id from "../../../../backk/types/id/_Id";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import { ArrayMaxSize, ArrayMinSize, IsEmail, IsPhoneNumber, MaxLength, IsAscii, IsString } from "class-validator"
import { Unique } from "../../../../backk/decorators/typeproperty/Unique"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"
import { Lengths } from "../../../../backk/constants/constants"
import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor"
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

  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

  @MaxLength(Lengths._256)
  @IsOneOf(getCities, 'usersService.getCities', 'Tampere')
  public city!: string;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public imageDataUri!: string;

  public readonly ownSalesItems!: OwnSalesItem[];

  @ManyToMany()
  public readonly followedUsers!: FollowUser[];

  @ManyToMany()
  public readonly followingUsers!: FollowUser[];

}