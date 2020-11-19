// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInstance,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';
import SortBy from '../../../../backk/types/postqueryoperations/SortBy';
import SubPagination from '../../../../backk/types/postqueryoperations/SubPagination';

export default class GetByUserIdArg {
  userId!: string;

  @IsOptional()
  @IsString({
    each: true
  })
  @MaxLength(4096, {
    each: true
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({
    each: true
  })
  @MaxLength(4096, {
    each: true
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInstance(SortBy, {
    each: true
  })
  @ValidateNested()
  @IsArray()
  @ArrayMaxSize(25)
  sortBys: SortBy[] = [new SortBy('_id', 'ASC')];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageNumber: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 50;

  @IsOptional()
  @IsInstance(SubPagination, {
    each: true
  })
  @ValidateNested()
  @IsArray()
  @ArrayMaxSize(25)
  subPaginations: SubPagination[] = [];
}
