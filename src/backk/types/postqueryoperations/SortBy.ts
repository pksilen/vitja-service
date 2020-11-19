import { IsIn, IsString, MaxLength } from "class-validator";

export default class SortBy {
  constructor(fieldName: string, sortDirection: 'ASC' | 'DESC') {
    this.fieldName = fieldName;
    this.sortDirection = sortDirection;
  }

  @MaxLength(512)
  @IsString()
  fieldName!: string;

  @IsIn(['ASC', 'DESC'])
  sortDirection!: 'ASC' | 'DESC';
}
