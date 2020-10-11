import { IsInt, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { Id } from '../../../../backk/Backk';
import { ExpectInTestsToMatch } from '../../../../backk/ExpectInTestsToMatch';
import ShoppingCartItem from '../../../shoppingcart/types/entities/ShoppingCartItem';

@Entity()
export default class Order extends Id {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];

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
