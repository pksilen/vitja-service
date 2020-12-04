// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { ArrayMaxSize, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { ManyToMany } from '../../../../backk/decorators/typeproperty/ManyToMany';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import Tag from '../../../tags/entities/Tag';
import { Area } from '../enums/Area';
import { Category } from '../enums/Category';
import { Department } from '../enums/Department';

export default class UpdateSalesItemArg {
  public userId?: string;

  @MaxLength(64)
  public title?: string;

  @MaxLength(1024)
  public description?: string;

  @ManyToMany()
  @ArrayMaxSize(25)
  public tags?: Tag[];

  public area?: Area;

  public productDepartment?: Department;

  public productCategory?: Category;

  public productSubCategory?: Category;

  @IsNumber({
    maxDecimalPlaces: 2
  })
  @Min(0)
  @Max(1000000000)
  public price?: number;

  @MaxLength(2097152)
  public primaryImageDataUri?: string;

  @MaxLength(2097152, {
    each: true
  })
  @ArrayMaxSize(10)
  public secondaryImageDataUris?: string[];

  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  _id!: string;
}
