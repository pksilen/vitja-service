import { IsNumber, IsPositive } from 'class-validator';

export default class SalesItemWithoutId {
  userId!: string;
  title!: string;
  description!: string;
  productDepartment!: 'Vehicles';
  productCategory!: 'Vehicles';
  productSubCategory!: 'Vehicles';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  previousPrice!: number;

  primaryImageDataUri!: string;
  secondaryImageDataUris!: string[];
}
