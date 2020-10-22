import { IsArray, IsInstance, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import SortBy from "./SortBy";
import { Paging } from "./Paging";
import { OptionalProjection } from "./OptionalProjection";

export default class OptPostQueryOps implements Partial<Paging>, OptionalProjection {
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
  pageNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  pageSize?: number;

  @IsOptional()
  @IsInstance(SortBy, { each: true })
  @IsArray()
  sortBys?: SortBy[];
}
