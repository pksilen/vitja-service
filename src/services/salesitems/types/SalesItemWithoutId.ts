import { IsNumber, IsPositive } from 'class-validator';

export default class SalesItemWithoutId {
  userId!: string;
  title!: string;
  description!: string;
  area!: 'Area1' | 'Area2' | 'Area3';
  productDepartment!: 'Vehicles' | 'Clothes';
  productCategory!: 'Vehicles' | 'Clothes';
  productSubCategory!: 'Vehicles' | 'Clothes';

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  previousPrice!: number;

  primaryImageDataUri!: string;
  secondaryImageDataUris!: string[];
}
