import { IsInt, Max, MaxLength, Min } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { ExpectInTestsToMatch } from "../../../../backk/decorators/typeproperty/testing/ExpectInTestsToMatch";
import Id from "../../../../backk/types/Id";

@Entity()
export default class OrderItem extends Id {
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
