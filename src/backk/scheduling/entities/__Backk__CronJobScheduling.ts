/* eslint-disable @typescript-eslint/class-name-casing,@typescript-eslint/camelcase */
import Entity from "../../decorators/entity/Entity";
import _Id from "../../types/id/_Id";
import { IsDate, IsString, MaxLength } from "class-validator";
import { Unique } from "../../decorators/typeproperty/Unique";

@Entity()
export default class __Backk__CronJobScheduling extends _Id {
  @Unique()
  @IsString()
  @MaxLength(512)
  serviceFunctionName!: string;

  @IsDate()
  lastScheduledTimestamp!: Date;

  @IsDate()
  nextScheduledTimestamp!: Date;
}
