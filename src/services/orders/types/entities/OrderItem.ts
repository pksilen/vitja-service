import { IsUrl, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";
import { OrderState } from "../enum/OrderState";
import { ShouldBeTrueForEntity } from "../../../../backk/decorators/typeproperty/ShouldBeTrueForEntity";
import { Lengths } from "../../../../backk/constants/constants";

@Entity()
export default class OrderItem extends Id {
  public salesItemId!: string;

  @ShouldBeTrueForEntity(
    ({ state, deliveryTimestamp }) =>
      (state === 'toBeDelivered' && deliveryTimestamp === null) ||
      (state !== 'toBeDelivered' && deliveryTimestamp !== null)
  )
  public deliveryTimestamp!: Date | null;

  public state!: OrderState;

  @MaxLength(Lengths._4K)
  @IsUrl()
  @ShouldBeTrueForEntity(
    ({ state, trackingUrl }) =>
      (state === 'toBeDelivered' && trackingUrl === null) ||
      (state !== 'toBeDelivered' && trackingUrl !== null)
  )
  public trackingUrl!: string | null;
}
