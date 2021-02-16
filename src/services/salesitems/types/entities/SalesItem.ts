import { ArrayMaxSize, IsNumber, MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp from '../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp';
import { Area } from '../enums/Area';
import { Department } from '../enums/Department';
import { Category } from '../enums/Category';
import { SalesItemState } from '../enums/SalesItemState';
import { ManyToMany } from '../../../../backk/decorators/typeproperty/ManyToMany';
import Tag from '../../../tags/entities/Tag';
import Index from '../../../../backk/decorators/typeproperty';
import MinMax from '../../../../backk/decorators/typeproperty/MinMax';
import IsAnyString from '../../../../backk/decorators/typeproperty/IsAnyString';
import IsDataUri from '../../../../backk/decorators/typeproperty/IsDataUri';
import ArrayNotUnique from '../../../../backk/decorators/typeproperty/ArrayNotUnique';
import { Lengths, Values } from "../../../../backk/constants/constants";

@Entity()
export class SalesItem extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp {
  public userId!: string;

  @MaxLength(Lengths._64)
  @IsAnyString()
  public title!: string;

  @MaxLength(Lengths._1K)
  @IsAnyString()
  public description!: string;

  @ManyToMany()
  @ArrayMaxSize(25)
  public tags!: Tag[];

  public area!: Area;
  public productDepartment!: Department;
  public productCategory!: Category;
  public productSubCategory!: Category;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, Values._1B)
  public price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(-1, Values._1B)
  public readonly previousPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, Values._1B)
  public shippingCost!: number;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public primaryImageDataUri!: string;

  @MaxLength(Lengths._10M, { each: true })
  @IsDataUri({ each: true })
  @ArrayMaxSize(10)
  @ArrayNotUnique()
  public secondaryImageDataUris!: string[];

  @Index()
  public readonly state!: SalesItemState;
}
