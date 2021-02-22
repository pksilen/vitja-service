// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsDate, IsNumber, MaxLength } from 'class-validator';
import { Lengths, Values } from '../../../../backk/constants/constants';
import Entity from '../../../../backk/decorators/entity/Entity';
import Index from '../../../../backk/decorators/typeproperty';
import IsAnyString from '../../../../backk/decorators/typeproperty/IsAnyString';
import IsDataUri from '../../../../backk/decorators/typeproperty/IsDataUri';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';
import { SalesItemState } from '../../../salesitems/types/enums/SalesItemState';

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

  @MaxLength(Lengths._64)
  @IsAnyString()
  public title!: string;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(0, Values._1B)
  public price!: number;

  @MaxLength(Lengths._1M)
  @IsDataUri()
  public readonly primaryImageThumbnailDataUri!: string;

  @Index()
  public readonly state!: SalesItemState;
}
