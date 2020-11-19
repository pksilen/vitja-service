import { Pagination } from "./Pagination";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export default class SubPagination implements Pagination {
  @IsString()
  @MaxLengthAndMatches(512, /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
  fieldName!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageNumber!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;
}
