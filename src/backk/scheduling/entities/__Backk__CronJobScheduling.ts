/* eslint-disable @typescript-eslint/class-name-casing,@typescript-eslint/camelcase */
import Entity from "../../decorators/entity/Entity";
import _Id from "../../types/id/_Id";
import { MaxLength } from "class-validator";

@Entity()
export default class __Backk__CronJobScheduling extends _Id {
  @MaxLength(512)
  serviceFunctionName!: string;

  lastScheduledTimestamp!: Date;

  nextScheduledTimestamp!: Date;
}
