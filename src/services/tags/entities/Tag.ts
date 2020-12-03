import Entity from "../../../backk/decorators/entity/Entity";
import _Id from "../../../backk/types/id/_Id";
import { MaxLength } from "class-validator";

@Entity()
export default class Tag extends _Id {
  @MaxLength(64)
  name!: string;
}
