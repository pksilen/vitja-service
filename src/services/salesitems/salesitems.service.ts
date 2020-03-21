import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ErrorResponse, IdWrapper, Projectable } from '../../backk/Backk';

export class SalesItemsFilters implements Projectable {
  @IsOptional()
  @IsString()
  sellerUserId?: string;

  @IsOptional()
  @IsString()
  textFilter?: string;

  /** @IsIn(['Area1', 'Area2', 'Area3'], { each: true }) **/
  @IsOptional()
  @IsIn(['Area1', 'Area2', 'Area3'], { each: true })
  @IsArray()
  areas?: string[];

  /** @IsIn(['Vehicles', 'Clothes'], { each: true}) **/
  @IsOptional()
  @IsIn(['Vehicles', 'Clothes'], { each: true })
  @IsArray()
  productDepartments?: string[];

  /** @IsIn(['Vehicles', 'Clothes'], { each: true}) **/
  @IsOptional()
  @IsIn(['Vehicles', 'Clothes'], { each: true })
  @IsArray()
  productCategories?: string[];

  /** @IsIn(['Vehicles', 'Clothes'], { each: true }) **/
  @IsOptional()
  @IsIn(['Vehicles', 'Clothes'], { each: true })
  @IsArray()
  productSubCategories?: string[];

  /** @IsInt() **/
  @IsOptional()
  @IsInt()
  minPrice?: number;

  /** @IsInt() **/
  @IsOptional()
  @IsInt()
  maxPrice?: number;

  /** @IsIn(['price', 'priceWhenPreviousPrice', 'createdTimestamp']) **/
  @IsOptional()
  @IsIn(['price', 'priceWhenPreviousPrice', 'createdTimestamp'])
  sortBy?: string;

  /** @IsIn(['ASC', 'DESC']) **/
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: string;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  includeResponseFields?: string[] = ['title', 'price', 'previousPrice', 'primaryImageDataUri'];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  excludeResponseFields?: string[];
}

export class SalesItemWithoutId {
  @IsString()
  sellerUserId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsIn(['Vehicles'])
  productDepartment!: string;

  @IsIn(['Vehicles'])
  productCategory!: string;

  @IsIn(['Vehicles'])
  productSubCategory!: string;

  /** @IsNumber({ maxDecimalPlaces: 2 }) **/
  @IsNumber({ maxDecimalPlaces: 2 })
  price!: number;

  /** @IsNumber({ maxDecimalPlaces: 2 }) **/
  @IsNumber({ maxDecimalPlaces: 2 })
  previousPrice!: number;

  @IsString()
  primaryImageDataUri!: string;

  @IsString({ each: true })
  @IsArray()
  secondaryImageDataUris!: string[];
}

export class SalesItem extends SalesItemWithoutId {
  @IsString()
  _id!: string;

  @IsInt()
  createdTimestampInMillis!: number;
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
  readonly GetSalesItemsReturnValueType = 'SalesItem[]';

  abstract getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse>;
  readonly GetSalesItemByIdReturnValueType = SalesItem;

  abstract createSalesItem(salesItem: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse>;
  readonly CreateSalesItemReturnValueType = IdWrapper;

  abstract updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
