// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';

export default class UpdateSalesItemArg {
  userId?: string;

  @MaxLength(64)
  title?: string;

  @MaxLength(1024)
  description?: string;

  area?: 'Area1' | 'Area2' | 'Area3';

  productDepartment?: 'Vehicles' | 'Clothes';

  productCategory?: 'Vehicles' | 'Clothes';

  productSubCategory?: 'Vehicles' | 'Clothes';

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @Min(0)
  @Max(1000000000)
  price?: number;

  @MaxLength(2097152)
  primaryImageDataUri?: string;

  @MaxLength(2097152, {
    each: true
  })
  @ArrayMaxSize(10)
  secondaryImageDataUris?: string[];

  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  _id!: string;
}
