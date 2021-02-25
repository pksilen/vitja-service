import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsInt, MaxLength } from "class-validator";
import SortBy from '../../../../backk/types/postqueryoperations/SortBy';
import DefaultPostQueryOperations from '../../../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';
import { Category } from '../enums/Category';
import { Department } from '../enums/Department';
import { Area } from '../enums/Area';
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import { Lengths } from "../../../../backk/constants/constants";

export default class GetSalesItemsArg extends DefaultPostQueryOperations {
  @MaxLength(Lengths._512)
  @IsAnyString()
  textFilter?: string;

  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayUnique()
  areas?: Area[];

  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayUnique()
  productDepartments?: Department[];

  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayUnique()
  productCategories?: Category[];

  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayUnique()
  productSubCategories?: Category[];

  @IsInt()
  @MinMax(0, 1000000000)
  minPrice?: number;

  @IsInt()
  @MinMax(0, 1000000000)
  maxPrice?: number;

  sortBys: SortBy[] = [
    { fieldName: '_id', sortDirection: 'DESC' },
    { subEntityPath: '*', fieldName: '_id', sortDirection: 'ASC' },
    { subEntityPath: '*', fieldName: 'id', sortDirection: 'ASC' }
  ];
}
