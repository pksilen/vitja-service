import { Paging } from "../../../backk/Backk";
import { IsInt, IsPositive, Max, MaxLength, Min } from "class-validator";

export default class UserIdAndPaging implements Paging {
  @MaxLength(24)
  userId!: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  pageNumber: number = 1;

  @IsInt()
  @Min(0)
  @Max(10000)
  pageSize: number = 50;
}
