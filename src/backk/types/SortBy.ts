import { IsIn, IsString, MaxLength } from "class-validator";
import { ISortBy } from "./ISortBy";

export default class SortBy implements ISortBy {
  constructor(sortField: string, sortDirection: 'ASC' | 'DESC') {
    this.sortField = sortField;
    this.sortDirection = sortDirection;
  }

  @MaxLength(512)
  @IsString()
  sortField!: string;

  @IsIn(['ASC', 'DESC'])
  sortDirection!: 'ASC' | 'DESC';
}
