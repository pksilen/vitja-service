import Entity from "../../decorators/entity/Entity";
import _Id from "../../types/id/_Id";
import { IsDate, IsString, MaxLength } from "class-validator";

@Entity()
// eslint-disable-next-line @typescript-eslint/camelcase,@typescript-eslint/class-name-casing
export default class __Backk__JobScheduling extends _Id {
  @IsString()
  @MaxLength(512)
  serviceFunctionName!: string;

  @IsString()
  @MaxLength(8192)
  serviceFunctionArgument!: string;

  @IsDate()
  scheduledExecutionTimestamp!: Date;

  @IsString()
  @MaxLength(512)
  retryIntervalsInSecs!: string;
}
