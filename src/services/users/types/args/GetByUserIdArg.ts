// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import { IsArray, IsInstance, IsInt, IsOptional, Max, MaxLength, Min } from 'class-validator';
import { SortBy } from '../../../../backk/Backk';

export default class GetByUserIdArg {
  @MaxLength(24)
  userId!: string;

  @IsOptional()
  @MaxLength(4096, {
    each: true
  })
  @IsArray()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @MaxLength(4096, {
    each: true
  })
  @IsArray()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  pageNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  pageSize?: number;

  @IsOptional()
  @IsInstance(SortBy, {
    each: true
  })
  @IsArray()
  sortBys?: SortBy[];
}
