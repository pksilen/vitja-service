import { ArrayMaxSize, IsArray, IsDate, IsInt, IsString, MaxLength } from 'class-validator';

export default class JobScheduling {
  @IsString()
  @MaxLength(256)
  serviceFunctionName!: string;

  @IsDate()
  scheduledExecutionTimestamp!: Date;

  @IsInt({ each: true })
  @IsArray()
  @ArrayMaxSize(25)
  retryIntervalsInSecs!: number[];
}
