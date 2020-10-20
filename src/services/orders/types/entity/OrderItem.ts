import { IsInt, Max, MaxLength, Min } from "class-validator";
import Entity from "../../../../backk/annotations/entity/Entity";
import { ExpectInTestsToMatch } from "../../../../backk/ExpectInTestsToMatch";

@Entity()
export default class OrderItem {
  @MaxLength(24)
  id!: string;

  @MaxLength(24)
  salesItemId!: string;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectInTestsToMatch(
    "state === 'toBeDelivered' && deliveryTimestampInSecs === 0 || state !== 'toBeDelivered' && deliveryTimestampInSecs !== 0"
  )
  deliveryTimestampInSecs!: number;

  state!: 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned';

  @MaxLength(1024)
  @ExpectInTestsToMatch(
    "state === 'toBeDelivered' && trackingUrl === '' || state !== 'toBeDelivered' && trackingUrl !== ''"
  )
  trackingUrl!: string;
}
