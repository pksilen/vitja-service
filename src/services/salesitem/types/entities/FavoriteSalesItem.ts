// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { MaxLength } from 'class-validator';
import { Lengths, Values } from '../../../../backk/constants/constants';
import Entity from '../../../../backk/decorators/entity/Entity';
import IsAnyString from '../../../../backk/decorators/typeproperty/IsAnyString';
import IsDataUri from '../../../../backk/decorators/typeproperty/IsDataUri';
import { IsFloat } from '../../../../backk/decorators/typeproperty/IsFloat';
import IsStringOrObjectId from '../../../../backk/decorators/typeproperty/IsStringOrObjectId';
import IsUndefined from '../../../../backk/decorators/typeproperty/IsUndefined';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches'; // eslint-disable-next-line @typescript-eslint/class-name-casing
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';

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
  public title!: string;

  @IsFloat(2)
  @MinMax(0, Values._1B)
  public price!: number;

  @IsFloat(2)
  @MinMax(0, Values._1B)
  public readonly previousPrice!: number | null;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public primaryImageDataUri!: string;
}
