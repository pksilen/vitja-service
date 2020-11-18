import { IsArray, IsIn, IsInstance, IsOptional, IsString, ValidateNested } from "class-validator";
import MaxLengthAndMatches from '../../decorators/typeproperty/MaxLengthAndMatches';

export default class UserDefinedFilter {
  @IsString()
  @MaxLengthAndMatches(512, /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
  fieldName!: string;

  @IsOptional()
  @IsIn(['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', 'IS NULL', 'IS NOT NULL'])
  operator?:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'IN'
    | 'NOT IN'
    | 'LIKE'
    | 'NOT LIKE'
    | 'IS NULL'
    | 'IS NOT NULL'
    | 'OR';

  value: any;

  @IsOptional()
  @IsInstance(UserDefinedFilter, { each: true })
  @ValidateNested({ each: true })
  @IsArray()
  filters?: UserDefinedFilter[];
}
