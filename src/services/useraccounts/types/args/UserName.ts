// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import Entity from "../../../../backk/decorators/entity/Entity";
import PaymentMethod from "../entities/PaymentMethod";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import Order from "../../../orders/types/entities/Order";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import IsOneOf from "../../../../backk/decorators/typeproperty/IsOneOf";
import getCities from "../../validation/getCities";
import IsStrongPassword from "../../../../backk/decorators/typeproperty/IsStrongPassword";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import FavoriteSalesItem from "../entities/FavoriteSalesItem";
import OwnSalesItem from "../entities/OwnSalesItem";
import FollowUser from "../entities/FollowUser";
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


export default class UserName {
  @Unique()
  @IsEmail()

  /* private */
  userName!: string;

}