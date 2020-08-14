import { Projection } from '../../../backk/Backk';
import { IsInt, IsPositive, Max, Min } from "class-validator";

export default class SalesItemsFilters implements Projection {
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

  sortBy: 'price' | 'priceWhenPreviousPrice' | 'createdTimestampInSecs' = 'createdTimestampInSecs';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];
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
