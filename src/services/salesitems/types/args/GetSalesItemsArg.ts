import { ArrayMaxSize, ArrayUnique, IsInt, MaxLength } from 'class-validator';
import SortBy from '../../../../backk/types/postqueryoperations/SortBy';
import DefaultPostQueryOperations from '../../../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';
import { Category } from '../enums/Category';
import { Department } from '../enums/Department';
import { Area } from '../enums/Area';

export default class GetSalesItemsArg extends DefaultPostQueryOperations {
  @MaxLength(512)
  textFilter?: string;

  @ArrayMaxSize(10)
  @ArrayUnique()
  areas?: Area[];

  @ArrayMaxSize(10)
  @ArrayUnique()
  productDepartments?: Department[];

  @ArrayMaxSize(10)
  @ArrayUnique()
  productCategories?: Category[];

  @ArrayMaxSize(10)
  @ArrayUnique()
  productSubCategories?: Category[];

  @IsInt()
  @MinMax(0, 1000000000)
  minPrice?: number;

  @IsInt()
  @MinMax(0, 1000000000)
  maxPrice?: number;

  @MaxLength(512, { each: true })
  @ArrayMaxSize(50)
  @ArrayUnique()
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];

  sortBys: SortBy[] = [
    { fieldName: '_id', sortDirection: 'DESC' },
    { subEntityPath: '*', fieldName: '_id', sortDirection: 'ASC' },
    { subEntityPath: '*', fieldName: 'id', sortDirection: 'ASC' }
  ];
}
