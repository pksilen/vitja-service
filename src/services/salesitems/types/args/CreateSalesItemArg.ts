// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsNumber, Max, MaxLength, Min } from 'class-validator';
import { Area } from '../enums/Area';
import { Category } from '../enums/Category';
import { Department } from '../enums/Department';

export default class CreateSalesItemArg {
  userId!: string;

  @MaxLength(64)
  title!: string;

  @MaxLength(1024)
  description!: string;

  area!: Area;

  productDepartment!: Department;

  productCategory!: Category;

  productSubCategory!: Category;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @Min(0)
  @Max(1000000000)
  price!: number;

  @MaxLength(2097152)
  primaryImageDataUri!: string;

  @MaxLength(2097152, {
    each: true
  })
  @ArrayMaxSize(10)
  secondaryImageDataUris!: string[];
}
