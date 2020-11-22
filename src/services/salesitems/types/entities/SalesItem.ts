import { ArrayMaxSize, IsNumber, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp from '../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp';

@Entity()
export class SalesItem extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp {
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
}
