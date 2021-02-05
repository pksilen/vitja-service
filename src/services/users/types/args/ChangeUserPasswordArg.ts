// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsEmail, IsPhoneNumber, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Documentation } from "../../../../backk/decorators/typeproperty/Documentation";
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import DefaultPaymentMethod from "../entities/DefaultPaymentMethod";
import PaymentMethod from "../entities/PaymentMethod";
import LengthAndMatchesAll from "../../../../backk/decorators/typeproperty/LengthOrMatchesAll";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import _IdAndCaptcha from "../../../../backk/types/id/_IdAndCaptcha";
import { SalesItem } from "../../../salesitems/types/entities/SalesItem";
import Order from "../../../orders/types/entities/Order";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import FollowedUser from "../entities/FollowedUser";
import FollowingUser from "../entities/FollowingUser";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import LengthAndMatches from "../../../../backk/decorators/typeproperty/LengthAndMatches";
import IsPostalCode from "../../../../backk/decorators/typeproperty/IsPostalCode";
import { IsAscii, IsString, MaxLength } from "class-validator";
import _Id from "../../../../backk/types/id/_Id";
import { Transient } from "../../../../backk/decorators/typeproperty/Transient"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import { Entity } from "../../../../backk/types/entities/Entity";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing


export default class ChangeUserPasswordArg {
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

  @Unique()
  @MaxLength(512)
  @IsEmail()
  userName!: string;

  @Documentation('Password doc goes here...')
  @ShouldBeTrueForEntity(({
    password
  }) => !password.toLowerCase().includes('password'), 'Password may not contain word password')
  @ShouldBeTrueForEntity(({
    password,
    userName
  }) => !password.toLowerCase().includes(userName.toLowerCase()), 'Password may not contain username')
  @LengthAndMatchesAll(8, 512, [/[a-z]+/, /[A-Z]+/, /\d+/, /[^\w\s]+/])
  password!: string;

  @LengthAndMatchesAll(8, 512, [/[a-z]+/, /[A-Z]+/, /\d+/, /[^\w\s]+/])
  currentPassword!: string;

}