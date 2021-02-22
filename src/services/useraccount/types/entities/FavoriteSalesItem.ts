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
import { ArrayMaxSize, ArrayMinSize, IsNumber, MaxLength, IsDate, IsString } from "class-validator"
import { Area } from "../../../salesitem/types/enums/Area"
import { Department } from "../../../salesitem/types/enums/Department"
import { Category } from "../../../salesitem/types/enums/Category"
import { SalesItemState } from "../../../salesitem/types/enums/SalesItemState"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"
import { Lengths, Values } from "../../../../backk/constants/constants"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"

import Entity from '../../../../backk/decorators/entity/Entity';
@Entity('SalesItem')
export default class FavoriteSalesItem {
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
  public readonly title!: string;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(0, Values._1B)
  public readonly price!: number;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(-1, Values._1B)
  public readonly previousPrice!: number;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public readonly primaryImageDataUri!: string;

}