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
import { ArrayMaxSize, ArrayMinSize, MaxLength, IsDate, IsString } from "class-validator"
import { Area } from "../enums/Area"
import { Department } from "../enums/Department"
import { Category } from "../enums/Category"
import { SalesItemState } from "../enums/SalesItemState"
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany"
import { Lengths, Values } from "../../../../backk/constants/constants"
import { IsFloat } from "../../../../backk/decorators/typeproperty/IsFloat"
import { Private } from "../../../../backk/decorators/typeproperty/Private"
import { BackkEntity } from "../../../../backk/types/entities/BackkEntity"

import Entity from '../../../../backk/decorators/entity/Entity';
@Entity('SalesItem')
export default class OwnSalesItem {
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
    groups: ['__backk_create__', '__backk_update__']
  })
  @IsDate({
    groups: ['__backk_none__']
  })
  public createdAtTimestamp!: Date;

  @IsUndefined({
    groups: ['__backk_create__', '__backk_update__']
  })
  @IsDate({
    groups: ['__backk_none__']
  })
  public lastModifiedTimestamp!: Date;

  @MaxLength(Lengths._64)
  @IsAnyString()
  public title!: string;

  @IsFloat(2)
  @MinMax(0, Values._1B)
  public price!: number;

  @IsFloat(2)
  @MinMax(-1, Values._1B)
  public readonly previousPrice!: number;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public primaryImageDataUri!: string;

  @MaxLength(Lengths._1M)
  @IsDataUri()
  public readonly primaryImageThumbnailDataUri!: string;

  @Index()
  public readonly state!: SalesItemState;

}