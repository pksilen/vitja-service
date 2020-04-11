import { Projectable } from '../../../backk/Backk';
import { IsInt, IsPositive, Min } from 'class-validator';

export default class SalesItemsFilters implements Projectable {
  textFilter?: string;
  areas?: ('Area1' | 'Area2' | 'Area3')[];
  productDepartments?: 'Vehicles'[];
  productCategories?: 'Vehicles'[];
  productSubCategories?: 'Vehicles'[];

  @Min(0)
  minPrice?: number;
  
  @Min(0)
  maxPrice?: number;

  sortBy: 'price' | 'priceWhenPreviousPrice' | 'createdTimestamp' = 'createdTimestamp';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];
  excludeResponseFields?: string[] = [];

  @IsInt()
  @IsPositive()
  pageNumber: number = 1;

  @IsInt()
  @IsPositive()
  pageSize: number = 50;
}
