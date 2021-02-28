// This is an auto-generated file from the respective .type file
// DO NOT MODIFY THIS FILE! Updates should be made to the respective .type file only
// This file can be generated from the respective .type file by running npm script 'generateTypes'

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInstance,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Lengths, Values } from '../../../../backk/constants/constants';
import MaxLengthAndMatches from '../../../../backk/decorators/typeproperty/MaxLengthAndMatches';
import Pagination from '../../../../backk/types/postqueryoperations/Pagination';
import SortBy from '../../../../backk/types/postqueryoperations/SortBy';

export default class GetUserAccountArg {
  @IsEmail()
  userName!: string;

  @IsOptional()
  @IsString({
    each: true
  })
  @MaxLengthAndMatches(
    Lengths._512,
    /^[a-zA-Z_]([a-zA-Z0-9_.])+$/,
    {
      each: true
    },
    true
  )
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(Values._500)
  @ArrayUnique()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({
    each: true
  })
  @MaxLengthAndMatches(
    Lengths._512,
    /^[a-zA-Z_]([a-zA-Z0-9_.])+$/,
    {
      each: true
    },
    true
  )
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(Values._500)
  @ArrayUnique()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInstance(SortBy, {
    each: true
  })
  @ValidateNested({
    each: true
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(Values._25)
  sortBys: SortBy[] = [new SortBy('*', '_id', 'ASC'), new SortBy('*', 'id', 'ASC')];

  @IsOptional()
  @IsInstance(Pagination, {
    each: true
  })
  @ValidateNested({
    each: true
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(Values._25)
  paginations: Pagination[] = [new Pagination('*', 1, Values._50)];
}
