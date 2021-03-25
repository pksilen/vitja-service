// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _Id from "../../../../backk/types/id/_Id";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import IsIntegerStringOrAny from "../../../../backk/decorators/typeproperty/IsIntegerStringOrAny"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing
// eslint-disable-next-line @typescript-eslint/class-name-casing
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId";
import { IsString, MaxLength } from "class-validator"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"
import { Values } from "../../../../backk/constants/constants"

import _IdAndOrderItemId from './_IdAndOrderItemId';

export default class RemoveOrderItemArg {
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

  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsString({
    groups: ['__backk_none__']
  })
  @MaxLength(24, {
    groups: ['__backk_none__']
  })
  @IsIntegerStringOrAny({
    groups: ['__backk_none__']
  })
  public version!: string;

  orderItemId!: string;

  @Unique()
  @IsStringOrObjectId()
  @MaxLengthAndMatches(Values._24, /^[a-f\d]{1,24}$/)
  userAccountId!: string;

}