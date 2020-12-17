import { ArrayMaxSize, IsArray, IsDate, IsInt, IsString, MaxLength } from 'class-validator';
import { Type } from "class-transformer";

export default class JobScheduling {
  @IsString()
  @MaxLength(256)
  serviceFunctionName!: string;

  @IsDate()
  @Type(() => Date)
  scheduledExecutionTimestamp!: Date;

  @IsInt({ each: true })
  @IsArray()
  @ArrayMaxSize(25)
  retryIntervalsInSecs!: number[];
}
