import { IsAlphanumeric, IsNumber, MaxLength } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import Entity from "../../../../backk/decorators/entity/Entity";
import { IsExternalId } from "../../../../backk/decorators/typeproperty/IsExternalId";

@Entity()
export default class PaymentInfo {
  @MaxLength(256)
  @IsAlphanumeric()
  @IsExternalId()
  public gatewayId!: string;

  @MaxLength(256)
  @IsAlphanumeric()
  @IsExternalId()
  public brokerId!: string;

  @MaxLength(256)
  @IsAlphanumeric()
  public transactionUuid!: string;

  public transactionTimestamp!: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, 100000000)
  public amount!: number;
}
