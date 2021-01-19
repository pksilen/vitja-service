import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInstance,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import OrFilter from "./OrFilter";

export default class UserDefinedFilter {
  @IsOptional()
  @IsString()
  @MaxLengthAndMatches(2048, /^([a-zA-Z_][a-zA-Z0-9_.]*|\*)$/)
  subEntityPath?: string = '';

  @IsOptional()
  @IsString()
  @MaxLengthAndMatches(512, /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
  fieldName?: string;

  @IsOptional()
  @IsIn([
    'ABS',
    'CEILING',
    'FLOOR',
    'ROUND',
    'LENGTH',
    'LOWER',
    'LTRIM',
    'RTRIM',
    'TRIM',
    'UPPER',
    'DAY',
    'HOUR',
    'MINUTE',
    'MONTH',
    'QUARTER',
    'SECOND',
    'WEEK',
    'WEEKDAY',
    'YEAR'
  ])
  fieldFunction?:
    | 'ABS'
    | 'CEILING'
    | 'FLOOR'
    | 'ROUND'
    | 'LENGTH'
    | 'LOWER'
    | 'LTRIM'
    | 'RTRIM'
    | 'TRIM'
    | 'UPPER'
    | 'DAY'
    | 'HOUR'
    | 'MINUTE'
    | 'MONTH'
    | 'QUARTER'
    | 'SECOND'
    | 'WEEK'
    | 'WEEKDAY'
    | 'YEAR';

  @IsOptional()
  @IsIn(['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', 'IS NULL', 'IS NOT NULL', 'OR'])
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

  @Allow()
  value: any;

  @IsOptional()
  @IsInstance(OrFilter, { each: true })
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMaxSize(10)
  orFilters?: OrFilter[];
}
