import Entity from "../decorators/entity/Entity";
import _Id from "../types/id/_Id";
import { MaxLength } from "class-validator";

@Entity()
export default class JobScheduling extends _Id {
  @MaxLength(512)
  serviceFunctionName!: string;

  lastScheduledTimestamp!: Date;

  nextScheduledTimestamp!: Date;
}
