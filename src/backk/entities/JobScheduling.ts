import Entity from "../decorators/entity/Entity";
import _Id from "../types/id/_Id";
import { MaxLength } from "class-validator";

@Entity()
export default class JobScheduling extends _Id {
  @MaxLength(512)
  serviceFunctionName!: string;

  @MaxLength(8192)
  serviceFunctionArgument!: string;

  scheduledAtTimestamp!: Date;

  @MaxLength(64)
  executionSchedulingId!: string;

  @MaxLength(512)
  retryIntervalsInSecs!: string;

  @MaxLength(512)
  schedulingServiceInstanceId!: string;
}
