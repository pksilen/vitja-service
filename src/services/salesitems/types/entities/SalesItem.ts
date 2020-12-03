import { ArrayMaxSize, IsNumber, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp from '../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp';
import { Area } from "../enums/Area";
import { Department } from "../enums/Department";
import { Category } from "../enums/Category";
import { SalesItemState } from "../enums/SalesItemState";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import Tag from "../../../tags/entities/Tag";

@Entity()
export class SalesItem extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp {
  userId!: string;

  @MaxLength(64)
  title!: string;

  @MaxLength(1024)
  description!: string;

  @ManyToMany()
  @ArrayMaxSize(25)
  tags!: Tag[];

  area!: Area;
  productDepartment!: Department;
  productCategory!: Category;
  productSubCategory!: Category;

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

  state!: SalesItemState;
}
