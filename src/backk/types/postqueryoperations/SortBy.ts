import { IsIn, IsOptional, IsString } from "class-validator";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

export default class SortBy {
  constructor(subEntityPath: string, fieldName: string, sortDirection: 'ASC' | 'DESC') {
    this.subEntityPath = subEntityPath;
    this.fieldName = fieldName;
    this.sortDirection = sortDirection;
  }

  @IsOptional()
  @MaxLengthAndMatches(2048, /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
  @IsString()
  subEntityPath?: string = '';

  @MaxLengthAndMatches(512, /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
  @IsString()
  fieldName!: string;

  @IsIn(['ASC', 'DESC'])
  sortDirection!: 'ASC' | 'DESC';
}
