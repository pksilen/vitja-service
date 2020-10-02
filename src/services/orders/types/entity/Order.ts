import Entity from '../../../../backk/annotations/entity/Entity';
import UpdateOrderArg from '../args/UpdateOrderArg';
import { IsInt, Max, MaxLength, Min } from 'class-validator';
import { ExpectAnyValueInTests } from '../../../../backk/ExpectAnyValueInTests';
import DeliverOrderArg from '../args/DeliverOrderArg';
import { ExpectInTestsToMatch } from '../../../../backk/ExpectInTestsToMatch';

@Entity()
export default class Order extends UpdateOrderArg implements DeliverOrderArg {
  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectInTestsToMatch(
    'createdTimestampInSecs <= Math.round(Date.now() / 1000) && createdTimestampInSecs > Math.round((Date.now() / 1000) - 60)'
  )
  createdTimestampInSecs!: number;

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
