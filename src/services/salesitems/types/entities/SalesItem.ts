import { ArrayMaxSize, IsInt, IsNumber, Max, MaxLength, Min } from "class-validator";
import Entity from '../../../../backk/decorators/entity/Entity';
import { ExpectInTestsToEvaluateTrue } from '../../../../backk/decorators/typeproperty/testing/ExpectInTestsToEvaluateTrue';
import _Id from '../../../../backk/types/id/_Id';
import { MAX_INT_VALUE } from '../../../../backk/constants/constants';

@Entity()
export class SalesItem extends _Id {
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
  @ArrayMaxSize(10)
  secondaryImageDataUris!: string[];

  state!: 'forSale' | 'sold';

  @IsInt()
  @Min(0)
  @Max(MAX_INT_VALUE)
  @ExpectInTestsToEvaluateTrue(
    ({ createdTimestampInSecs }) =>
      createdTimestampInSecs <= Math.round(Date.now() / 1000) &&
      createdTimestampInSecs > Math.round(Date.now() / 1000 - 60)
  )
  createdTimestampInSecs!: number;

  lastModifiedTimestamp!: Date;
}
