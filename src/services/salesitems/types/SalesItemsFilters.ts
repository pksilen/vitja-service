import { Projectable } from '../../../backk/Backk';
import { IsInt, IsPositive } from 'class-validator';

export default class SalesItemsFilters implements Projectable {
  textFilter?: string;
  areas?: ('Area1' | 'Area2' | 'Area3')[];
  productDepartments?: ('Vehicles' | 'Clothes')[];
  productCategories?: ('Vehicles' | 'Clothes')[];
  productSubCategories?: ('Vehicles' | 'Clothes')[];

  @IsInt()
  @IsPositive()
  minPrice?: number;

  @IsInt()
  @IsPositive()
  maxPrice?: number;

  sortBy?: 'price' | 'priceWhenPreviousPrice' | 'createdTimestamp';
  sortDirection?: 'ASC' | 'DESC';
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];
  excludeResponseFields?: string[] = [];
}
