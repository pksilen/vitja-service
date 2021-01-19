import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export default class Pagination {
  constructor(subEntityPath: string, pageNumber: number, pageSize: number) {
    this.subEntityPath = subEntityPath;
    this.pageNumber = pageNumber;
    this.pageSize = pageSize;
  }

  @IsOptional()
  @MaxLengthAndMatches(2048, /^([a-zA-Z_][a-zA-Z0-9_.]*|\*|)$/)
  @IsString()
  subEntityPath?: string = '';

  @IsInt()
  @Min(1)
  @Max(100)
  pageNumber!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;
}
