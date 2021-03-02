// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../../backk/decorators/entity/Entity";
import Tag from "../../../tag/entities/Tag";
import Index from "../../../../backk/decorators/typeproperty";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import ArrayNotUnique from "../../../../backk/decorators/typeproperty/ArrayNotUnique";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _IdAndVersionAndCreatedAtTimestamp from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestamp";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _Id from "../../../../backk/types/id/_Id";
import IsIntegerStringOrAny from "../../../../backk/decorators/typeproperty/IsIntegerStringOrAny"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import PaymentMethod from "../../../useraccount/types/entities/PaymentMethod";
import Order from "../../../order/types/entities/Order";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../../useraccount/validation/getCities";
import BaseUserAccount from "../../../../backk/types/useraccount/BaseUserAccount";
import FavoriteSalesItem from "../entities/FavoriteSalesItem";
import OwnSalesItem from "../entities/OwnSalesItem";
import FollowedUser from "../../../useraccount/types/entities/FollowedUser";
import FollowingUser from "../../../useraccount/types/entities/FollowingUser";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";
import { ArrayMaxSize, ArrayMinSize, IsNumber, MaxLength, IsDate, IsString, IsPhoneNumber, IsEmail, IsAscii } from "class-validator"
import { Area } from "../enums/Area"
import { Department } from "../enums/Department"
import { Category } from "../enums/Category"
import { SalesItemState } from "../enums/SalesItemState"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"
import { Lengths, Values } from "../../../../backk/constants/constants"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"
import { ShouldBeTrueFor } from "../../../../backk/decorators/typeproperty/ShouldBeTrueFor"
import { OneToMany } from "../../../../backk/decorators/typeproperty/OneToMany"
import { Unique } from "../../../../backk/decorators/typeproperty/Unique"
import { Private } from "../../../../backk/decorators/typeproperty/Private"
import { Transient } from "../../../../backk/decorators/typeproperty/Transient"


export default class FollowedUserSalesItem {
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

  @MaxLength(Lengths._64)
  @IsAnyString()
  public title!: string;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(0, Values._1B)
  public price!: number;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(-1, Values._1B)
  public readonly previousPrice!: number;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public primaryImageDataUri!: string;

  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsStringOrObjectId({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, {
    groups: ['__backk_update__']
  })
  public userAccountId!: string;

  @IsString()
  @MaxLength(Lengths._512)
  @IsAnyString()
  public displayName!: string;

}