import { PostQueryOps, Sorting } from '../../../backk/Backk';
import { IsInt, Max, MaxLength, Min } from 'class-validator';

export default class SalesItemsFilters implements PostQueryOps {
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

  sortings: Sorting[] = [new Sorting('createdTimestampInSecs', 'DESC')];

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
