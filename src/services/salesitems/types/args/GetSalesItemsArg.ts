import { ArrayMaxSize, ArrayUnique, Max, MaxLength, Min } from "class-validator";
import SortBy from "../../../../backk/types/postqueryoperations/SortBy";
import DefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/DefaultPostQueryOperations";

export default class GetSalesItemsArg extends DefaultPostQueryOperations {
  @MaxLength(512)
  textFilter?: string;

  @ArrayMaxSize(10)
  areas?: ('Area1' | 'Area2' | 'Area3')[];

  @ArrayMaxSize(10)
  productDepartments?: ('Vehicles' | 'Clothes')[];

  @ArrayMaxSize(10)
  productCategories?: ('Vehicles' | 'Clothes')[];

  @ArrayMaxSize(10)
  productSubCategories?: ('Vehicles' | 'Clothes')[];

  @Min(0)
  @Max(1000000000)
  minPrice?: number;

  @Min(0)
  @Max(1000000000)
  maxPrice?: number;

  @MaxLength(512, { each: true })
  @ArrayMaxSize(50)
  @ArrayUnique()
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];

  sortBys: SortBy[] = [{ fieldName: '_id', sortDirection: 'DESC' }];
  // or alternatively [new SortBys('_id', 'DESC')];
}
