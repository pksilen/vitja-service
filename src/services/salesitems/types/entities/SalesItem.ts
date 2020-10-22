import { IsInt, IsNumber, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { ExpectInTestsToMatch } from '../../../../backk/ExpectInTestsToMatch';
import Id from "../../../../backk/types/Id";

@Entity()
export class SalesItem extends Id {
  @MaxLength(24)
  userId!: string;

  @MaxLength(64)
  title!: string;

  @MaxLength(1024)
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
  @Min(-1)
  @Max(1000000000)
  previousPrice!: number;

  @MaxLength(2097152)
  primaryImageDataUri!: string;

  @MaxLength(2097152, { each: true })
  secondaryImageDataUris!: string[];

  state!: 'forSale' | 'sold';

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectInTestsToMatch(
    'createdTimestampInSecs <= Math.round(Date.now() / 1000) && createdTimestampInSecs > Math.round((Date.now() / 1000) - 60)'
  )
  createdTimestampInSecs!: number;
}
