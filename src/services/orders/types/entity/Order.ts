import { IsInt, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import { ExpectInTestsToMatch } from '../../../../backk/decorators/typeproperty/testing/ExpectInTestsToMatch';
import OrderItem from './OrderItem';
import _Id from "../../../../backk/types/_Id";

@Entity()
export default class Order extends _Id {
  @MaxLength(24)
  userId!: string;

  orderItems!: OrderItem[];

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectInTestsToMatch(
    'createdTimestampInSecs <= Math.round(Date.now() / 1000) && createdTimestampInSecs > Math.round((Date.now() / 1000) - 60)'
  )
  createdTimestampInSecs!: number;
}
