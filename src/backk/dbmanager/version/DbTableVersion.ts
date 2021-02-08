import Entity from "../../decorators/entity/Entity";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import _IdAndVersion from "../../types/id/_IdAndVersion";
import { Unique } from "../../decorators/typeproperty/Unique";

@Entity()
export default class DbTableVersion extends _IdAndVersion {
  @Unique()
  @MaxLengthAndMatches(512, /^[a-zA-Z_][a-zA-Z0-9_]*$/)
  entityName!: string;
}
