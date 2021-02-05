import { IsUrl, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import { ExpectTrueForResponseInTests } from "../../../../backk/decorators/typeproperty/testing/ExpectTrueForResponseInTests";
import Id from "../../../../backk/types/id/Id";
import { OrderState } from "../enum/OrderState";

@Entity()
export default class OrderItem extends Id {
  public salesItemId!: string;

  @ExpectTrueForResponseInTests(
    ({ state, deliveryTimestamp }) =>
      (state === 'toBeDelivered' && deliveryTimestamp === null) ||
      (state !== 'toBeDelivered' && deliveryTimestamp !== null)
  )
  public deliveryTimestamp!: Date | null;

  public state!: OrderState;

  @MaxLength(4096)
  @IsUrl()
  @ExpectTrueForResponseInTests(
    ({ state, trackingUrl }) =>
      (state === 'toBeDelivered' && trackingUrl ===  null) || (state !== 'toBeDelivered' && trackingUrl !== null)
  )
  public trackingUrl!: string | null;
}
