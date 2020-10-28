import { IsInt, Max, Min } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import { ExpectInTestsToEvaluateTrue } from '../../../../backk/decorators/typeproperty/testing/ExpectInTestsToEvaluateTrue';
import OrderItem from './OrderItem';
import _Id from '../../../../backk/types/id/_Id';
import { MAX_INT_VALUE } from '../../../../backk/constants';

@Entity()
export default class Order extends _Id {
  userId!: string;

  orderItems!: OrderItem[];

  @IsInt()
  @Min(0)
  @Max(MAX_INT_VALUE)
  @ExpectInTestsToEvaluateTrue(
    ({ createdTimestampInSecs }) =>
      createdTimestampInSecs <= Math.round(Date.now() / 1000) &&
      createdTimestampInSecs > Math.round(Date.now() / 1000 - 60)
  )
  createdTimestampInSecs!: number;
}
