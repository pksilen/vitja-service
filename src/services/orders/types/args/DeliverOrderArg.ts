import { Id } from "../../../../backk/Backk";
import { IsInt, Max, MaxLength, Min } from "class-validator";

export default class DeliverOrderArg extends Id {
  @IsInt()
  @Min(0)
  @Max(2147483647)
  deliveryTimestampInSecs!: number;

  @MaxLength(1024)
  trackingUrl!: string;
}
