import { PostQueryOperations } from "./PostQueryOperations";
import SortBy from "./SortBy";
import {
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

export default class DefaultPostQueryOperations implements PostQueryOperations {
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  pageNumber: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  pageSize: number = 50;

  @IsOptional()
  @IsInstance(SortBy, { each: true })
  @ValidateNested()
  @IsArray()
  sortBys: SortBy[] = [new SortBy('_id', 'ASC')];
}
