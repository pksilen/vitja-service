// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsNumber, MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp from '../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp';
import { Area } from "../../../salesitems/types/enums/Area";
import { Department } from "../../../salesitems/types/enums/Department";
import { Category } from "../../../salesitems/types/enums/Category";
import { SalesItemState } from "../../../salesitems/types/enums/SalesItemState";
import { ManyToMany } from '../../../../backk/decorators/typeproperty/ManyToMany';
import Tag from '../../../tags/entities/Tag';
import Index from '../../../../backk/decorators/typeproperty';
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';
import IsAnyString from '../../../../backk/decorators/typeproperty/IsAnyString';
import IsDataUri from '../../../../backk/decorators/typeproperty/IsDataUri';
import _IdAndVersionAndCreatedAtTimestamp from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestamp";
import { Entity } from "../../../../backk/types/entities/Entity";
import { IsDate } from 'class-validator';
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined"; // eslint-disable-next-line @typescript-eslint/class-name-casing
import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion";
import { IsDate } from "class-validator";
import _Id from "../../../../backk/types/id/_Id";
import { IsNumberString, IsString, MaxLength } from "class-validator";
import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import IsUndefined from "../../../../backk/decorators/typeproperty/IsUndefined";
import IsStringOrObjectId from "../../../../backk/decorators/typeproperty/IsStringOrObjectId"; // eslint-disable-next-line @typescript-eslint/class-name-casing

import Entity from '../../../../backk/decorators/entity/Entity';
@Entity('SalesItem')
export default class FollowerSalesItem {
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

  @MaxLength(64)
  @IsAnyString()
  public title!: string;

  @MaxLength(1024)
  @IsAnyString()
  public description!: string;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(0, 1000000000)
  public price!: number;

  @MaxLength(10485760)
  @IsDataUri()
  public primaryImageDataUri!: string;

}