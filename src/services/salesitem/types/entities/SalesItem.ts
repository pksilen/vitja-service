import { ArrayMaxSize, ArrayMinSize, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { Area } from "../enums/Area";
import { Department } from "../enums/Department";
import { Category } from "../enums/Category";
import { SalesItemState } from "../enums/SalesItemState";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import Tag from "../../../tag/entities/Tag";
import Index from "../../../../backk/decorators/typeproperty";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import IsAnyString from "../../../../backk/decorators/typeproperty/IsAnyString";
import IsDataUri from "../../../../backk/decorators/typeproperty/IsDataUri";
import ArrayNotUnique from "../../../../backk/decorators/typeproperty/ArrayNotUnique";
import { Lengths, Values } from "../../../../backk/constants/constants";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId";
import { Transient } from "../../../../backk/decorators/typeproperty/Transient";
import { IsFloat } from "../../../../backk/decorators/typeproperty/IsFloat";

@Entity()
export class SalesItem extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId {
  @MaxLength(Lengths._64)
  @IsAnyString()
  public title!: string;

  @MaxLength(Lengths._1K)
  @IsAnyString()
  public description!: string;

  @ManyToMany()
  @ArrayMinSize(0)
  @ArrayMaxSize(Values._25)
  public tags!: Tag[];

  public area!: Area;
  public productDepartment!: Department;
  public productCategory!: Category;
  public productSubCategory!: Category;

  @IsFloat(2 )
  @MinMax(0, Values._1B)
  public price!: number;

  @IsFloat(2 )
  @MinMax(-1, Values._1B)
  public readonly previousPrice!: number;

  @IsFloat(2 )
  @MinMax(0, Values._1B)
  public shippingCost!: number;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public primaryImageDataUri!: string;

  @MaxLength(Lengths._1M)
  @IsDataUri()
  @Transient()
  public readonly primaryImageThumbnailDataUri!: string;

  @MaxLength(Lengths._10M, { each: true })
  @IsDataUri({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayNotUnique()
  public secondaryImageDataUris!: string[];

  @Index()
  public readonly state!: SalesItemState;
}
