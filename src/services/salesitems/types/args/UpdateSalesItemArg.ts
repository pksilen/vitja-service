// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsNumber, IsOptional, Max, MaxLength, Min } from 'class-validator';

export default class UpdateSalesItemArg {
  @MaxLength(24)
  @IsOptional()
  userId!: string;

  @MaxLength(64)
  @IsOptional()
  title!: string;

  @MaxLength(1024)
  @IsOptional()
  description!: string;

  @IsOptional()
  area!: 'Area1' | 'Area2' | 'Area3';

  @IsOptional()
  productDepartment!: 'Vehicles' | 'Clothes';

  @IsOptional()
  productCategory!: 'Vehicles' | 'Clothes';

  @IsOptional()
  productSubCategory!: 'Vehicles' | 'Clothes';

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @Min(0)
  @Max(1000000000)
  @IsOptional()
  price!: number;

  @MaxLength(2097152)
  @IsOptional()
  primaryImageDataUri!: string;

  @MaxLength(2097152, {
    each: true
  })
  @IsOptional()
  secondaryImageDataUris!: string[];

  @MaxLength(24)
  _id!: string;
}
