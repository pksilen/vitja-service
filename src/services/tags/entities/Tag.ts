import Entity from "../../../backk/decorators/entity/Entity";
import _Id from "../../../backk/types/id/_Id";
import { MaxLength } from "class-validator";
import IsAnyString from "../../../backk/decorators/typeproperty/IsAnyString";
import { Unique } from "../../../backk/decorators/typeproperty/Unique";
import { Lengths } from "../../../backk/constants/constants";

@Entity()
export default class Tag extends _Id {
  @MaxLength(Lengths._64)
  @IsAnyString()
  @Unique()
  public name!: string;
}
