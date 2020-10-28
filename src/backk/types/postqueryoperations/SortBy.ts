import { IsIn, IsString, MaxLength } from "class-validator";

export default class SortBy {
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
