import { PostQueryOperations } from "./PostQueryOperations";
import SortBy from "./SortBy";
import {
  ArrayMaxSize, ArrayUnique,
  IsArray,
  IsInstance,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";
import SubPagination from "./SubPagination";

export default class DefaultPostQueryOperations implements PostQueryOperations {
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInstance(SortBy, { each: true })
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
  @IsInstance(SubPagination, { each: true })
  @ValidateNested()
  @IsArray()
  @ArrayMaxSize(25)
  subPaginations: SubPagination[] = [];
}
