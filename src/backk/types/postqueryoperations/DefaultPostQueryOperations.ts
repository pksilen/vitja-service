import { PostQueryOperations } from './PostQueryOperations';
import SortBy from './SortBy';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInstance,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';
import Pagination from './Pagination';

export default class DefaultPostQueryOperations implements PostQueryOperations {
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  includeResponseFields?: string[] = [];

  @IsOptional()
  @IsString({ each: true })
  @MaxLength(4096, { each: true })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  excludeResponseFields?: string[] = [];

  @IsOptional()
  @IsInstance(SortBy, { each: true })
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMaxSize(25)
  sortBys: SortBy[] = [new SortBy('*', '_id', 'ASC'), new SortBy('*', 'id', 'ASC')];

  @IsOptional()
  @IsInstance(Pagination, { each: true })
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMaxSize(25)
  paginations: Pagination[] = [new Pagination('*', 1, 50)];
}
