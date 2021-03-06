import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsInt, MaxLength } from "class-validator";
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
import { Lengths, MAX_INT_VALUE, Values } from "../../../../backk/constants/constants";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId";
import { IsFloat } from "../../../../backk/decorators/typeproperty/IsFloat";
import { Private } from "../../../../backk/decorators/typeproperty/Private";

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
  @MinMax(0, Values._1B)
  public readonly previousPrice!: number | null;

  @IsFloat(2 )
  @MinMax(0, Values._1B)
  public shippingCost!: number;

  @MaxLength(Lengths._10M)
  @IsDataUri()
  public primaryImageDataUri!: string;

  @MaxLength(Lengths._1M)
  @IsDataUri()
  public readonly primaryImageThumbnailDataUri!: string;

  @MaxLength(Lengths._10M, { each: true })
  @IsDataUri({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ArrayNotUnique()
  public secondaryImageDataUris!: string[];

  @Index()
  public readonly state!: SalesItemState;

  @Private()
  readonly buyerUserAccountId: string | null = null;

  @ArrayUnique()
  @Private()
  readonly priceChangeFollowingUserAccountIds!: string[];

  @ArrayUnique()
  @Private()
  readonly likedUserAccountIds!: string[];

  @IsInt()
  @MinMax(0, MAX_INT_VALUE)
  public readonly likeCount!: number;
}
