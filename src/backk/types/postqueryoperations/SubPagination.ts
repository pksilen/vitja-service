import { Pagination } from "./Pagination";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { IsInt, IsString, Max, Min } from "class-validator";

export default class SubPagination implements Pagination {
  @IsString()
  @MaxLengthAndMatches(2048, /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
  fieldName!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  pageNumber!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;
}
