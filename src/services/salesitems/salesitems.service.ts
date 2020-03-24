import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ErrorResponse, getSourceFileName, IdsWrapper, IdWrapper, Projectable } from '../../backk/Backk';
import { Service } from '../../backk/service';

export class SalesItemsFilters implements Projectable {
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
  @IsPositive()
  minPrice?: number;

  /** @IsInt() **/
  @IsOptional()
  @IsInt()
  @IsPositive()
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
  userId!: string;

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
  @IsPositive()
  price!: number;

  /** @IsNumber({ maxDecimalPlaces: 2 }) **/
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
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

export default abstract class SalesItemsService implements Service {
  readonly fileName = getSourceFileName(__filename);

  readonly Types = {
    IdWrapper,
    IdsWrapper,
    SalesItemsFilters,
    SalesItemWithoutId,
    SalesItem
  };

  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<Partial<SalesItem>[] | ErrorResponse>;
  abstract getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract getSalesItemsByUserId(idWrapper: IdWrapper): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds(idsWrapper: IdsWrapper): Promise<SalesItem[] | ErrorResponse>;
  abstract createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
