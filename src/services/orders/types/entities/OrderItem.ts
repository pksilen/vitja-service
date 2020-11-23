import { MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { ExpectToEvaluateTrueInTests } from "../../../../backk/decorators/typeproperty/testing/ExpectToEvaluateTrueInTests";
import Id from "../../../../backk/types/id/Id";
import { OrderState } from "../enum/OrderState";

@Entity()
export default class OrderItem extends Id {
  salesItemId!: string;

  @ExpectToEvaluateTrueInTests(
    ({ state, deliveryTimestamp }) =>
      (state === 'toBeDelivered' && deliveryTimestamp === null) ||
      (state !== 'toBeDelivered' && deliveryTimestamp !== null)
  )
  deliveryTimestamp!: Date | null;

  state!: OrderState;

  @MaxLength(1024)
  @ExpectToEvaluateTrueInTests(
    ({ state, trackingUrl }) =>
      (state === 'toBeDelivered' && trackingUrl ===  null) || (state !== 'toBeDelivered' && trackingUrl !== null)
  )
  trackingUrl!: string | null;
}
