// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsNumber, MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';

@Entity('SalesItem')
export default class FollowerSalesItem {
  @IsUndefined({
    groups: ['__backk_create__']
  })
  @IsStringOrObjectId({
    groups: ['__backk_update__']
  })
  @MaxLengthAndMatches(24, /^[a-f\d]+$/, {
    groups: ['__backk_update__']
  })
  public _id!: string;

  @MaxLength(64)
  public title!: string;

  @MaxLength(1024)
  public description!: string;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @MinMax(0, 1000000000)
  public price!: number;

  @MaxLength(2097152)
  public primaryImageDataUri!: string;
}
