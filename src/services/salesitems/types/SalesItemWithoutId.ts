import { IsNumber, IsPositive, Max, Min } from "class-validator";

export default class SalesItemWithoutId {
  userId!: string;
  title!: string;
  description!: string;
  area!: 'Area1' | 'Area2' | 'Area3';
  productDepartment!: 'Vehicles' | 'Clothes';
  productCategory!: 'Vehicles' | 'Clothes';
  productSubCategory!: 'Vehicles' | 'Clothes';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000000)
  price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000000)
  previousPrice!: number;

  primaryImageDataUri!: string;
  secondaryImageDataUris!: string[];
}
