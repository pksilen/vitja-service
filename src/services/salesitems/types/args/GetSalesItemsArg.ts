import { IsInt, Max, MaxLength, Min } from 'class-validator';
import { PostQueryOperations } from "../../../../backk/types/postqueryoperations/PostQueryOperations";
import SortBy from "../../../../backk/types/postqueryoperations/SortBy";

export default class GetSalesItemsArg implements PostQueryOperations {
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

  sortBys: SortBy[] = [{ sortField: 'createdTimestampInSecs', sortDirection: 'DESC' }];
  // or alternatively [new SortBys('createdTimestampInSecs', 'DESC')];

  @MaxLength(512, { each: true })
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];

  @MaxLength(512, { each: true })
  excludeResponseFields?: string[] = [];

  @IsInt()
  @Min(1)
  @Max(1000)
  pageNumber: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 50;
}
