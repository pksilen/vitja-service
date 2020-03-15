import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ErrorResponse, IdWrapper, Projectable } from '../../backk/Backk';

export class SalesItemsFilters implements Projectable {
  @IsString()
  @IsOptional()
  sellerUserId?: string;

  @IsString()
  @IsOptional()
  textFilter?: string;

  /** @IsIn(['Area1', 'Area2', 'Area3'], { each: true }) **/
  @IsArray()
  @IsIn(['Area1', 'Area2', 'Area3'], { each: true })
  @IsOptional()
  areas?: string[];

  /** @IsIn(['Vehicles'], { each: true}) **/
  @IsArray()
  @IsIn(['Vehicles'], { each: true })
  @IsOptional()
  productDepartments?: string[];

  /** @IsIn(['Vehicles'], { each: true}) **/
  @IsArray()
  @IsIn(['Vehicles'], { each: true })
  @IsOptional()
  productCategories?: string[];

  /** @IsIn(['Vehicles']) **/
  @IsArray()
  @IsIn(['Vehicles'], { each: true })
  @IsOptional()
  productSubCategories?: string[];

  /** @IsInt() **/
  @IsInt()
  @IsOptional()
  minPrice?: number;

  /** @IsInt() **/
  @IsInt()
  @IsOptional()
  maxPrice?: number;

  /** @IsIn(['price', 'priceWhenPreviousPrice', 'createdTimestamp']) **/
  @IsIn(['price', 'priceWhenPreviousPrice', 'createdTimestamp'])
  @IsOptional()
  sortBy?: string;

  /** @IsIn(['ASC', 'DESC']) **/
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortDirection?: string;

  @IsArray()
  @IsOptional()
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];

  @IsArray()
  @IsOptional()
  excludeResponseFields?: string[];
}

export class SalesItemWithoutId {
  @IsString()
  sellerUserId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  @IsIn(['Vehicles'], { each: true })
  productDepartment!: string;

  @IsString()
  @IsIn(['Vehicles'], { each: true })
  productCategory!: string;

  @IsString()
  @IsIn(['Vehicles'], { each: true })
  productSubCategory!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  previousPrice!: number;

  @IsInt()
  createdTimestampInMillis!: number;

  @IsString()
  primaryImageDataUri!: string;

  @IsArray()
  secondaryImageDataUris!: string[];
}

export class SalesItem extends SalesItemWithoutId {
  @IsString()
  _id!: string;
}

export default abstract class SalesItemsService {
  readonly Types = {
    IdWrapper,
    SalesItemsFilters,
    SalesItemWithoutId,
    SalesItem
  };

  abstract getSalesItems(
    salesItemsFilters: SalesItemsFilters
  ): Promise<Array<Partial<SalesItem>> | ErrorResponse>;

  abstract getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract createSalesItem(salesItem: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
