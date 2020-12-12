import { ArrayMaxSize, IsNumber, Max, MaxLength, Min } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp";
import { Area } from "../enums/Area";
import { Department } from "../enums/Department";
import { Category } from "../enums/Category";
import { SalesItemState } from "../enums/SalesItemState";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import Tag from "../../../tags/entities/Tag";
import Index from "../../../../backk/decorators/entity";

@Entity()
@Index(['state'])
export class SalesItem extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp {
  public userId!: string;

  @MaxLength(64)
  public title!: string;

  @MaxLength(1024)
  public description!: string;

  @ManyToMany()
  @ArrayMaxSize(25)
  public tags!: Tag[];

  public area!: Area;
  public productDepartment!: Department;
  public productCategory!: Category;
  public productSubCategory!: Category;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000000000)
  public price!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-1)
  @Max(1000000000)
  public readonly previousPrice!: number;

  @MaxLength(2097152)
  public primaryImageDataUri!: string;

  @MaxLength(2097152, { each: true })
  @ArrayMaxSize(10)
  public secondaryImageDataUris!: string[];

  public readonly state!: SalesItemState;
}
