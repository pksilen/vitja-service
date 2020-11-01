import { IsInt, Max, MaxLength, Min } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import { ExpectInTestsToEvaluateTrue } from '../../../../backk/decorators/typeproperty/testing/ExpectInTestsToEvaluateTrue';
import Id from '../../../../backk/types/id/Id';
import { MAX_INT_VALUE } from "../../../../backk/constants/constants";

@Entity()
export default class OrderItem extends Id {
  salesItemId!: string;

  @IsInt()
  @Min(0)
  @Max(MAX_INT_VALUE)
  @ExpectInTestsToEvaluateTrue(
    ({ state, deliveryTimestampInSecs }) =>
      (state === 'toBeDelivered' && deliveryTimestampInSecs === 0) ||
      (state !== 'toBeDelivered' && deliveryTimestampInSecs !== 0)
  )
  deliveryTimestampInSecs!: number;

  state!: 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned';

  @MaxLength(1024)
  @ExpectInTestsToEvaluateTrue(
    ({ state, trackingUrl }) =>
      (state === 'toBeDelivered' && trackingUrl === '') || (state !== 'toBeDelivered' && trackingUrl !== '')
  )
  trackingUrl!: string;
}
