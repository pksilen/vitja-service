import { IsInt, Max, MaxLength, Min } from 'class-validator';
import SortBy from '../../../../backk/types/postqueryoperations/SortBy';
import DefaultPostQueryOperations from '../../../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import { PostQueryOperations } from '../../../../backk/types/postqueryoperations/PostQueryOperations';

export default class GetSalesItemsArg extends DefaultPostQueryOperations implements PostQueryOperations {
  @MaxLength(512)
  textFilter?: string;

  areas?: ('Area1' | 'Area2' | 'Area3')[];
  productDepartments?: ('Vehicles' | 'Clothes')[];
  productCategories?: ('Vehicles' | 'Clothes')[];
  productSubCategories?: ('Vehicles' | 'Clothes')[];

  @Min(0)
  @Max(1000000000)
  minPrice?: number;

  @Min(0)
  @Max(1000000000)
  maxPrice?: number;

  @MaxLength(512, { each: true })
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];

  sortBys: SortBy[] = [{ sortField: '_id', sortDirection: 'DESC' }];
  // or alternatively [new SortBys('_id', 'DESC')];

  @IsInt()
  @Min(1)
  @Max(1000)
  pageNumber = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;
}
