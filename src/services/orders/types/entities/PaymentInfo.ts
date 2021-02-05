import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import { IsAlphanumeric, IsNumber, MaxLength } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import Entity from "../../../../backk/decorators/entity/Entity";

@Entity()
export default class PaymentInfo {
  @MaxLength(256)
  @IsAlphanumeric()
  public gatewayExternalId!: string;

  @MaxLength(256)
  @IsAlphanumeric()
  public brokerExternalId!: string;

  @MaxLength(256)
  @IsAlphanumeric()
  public transactionUuid!: string;

  public transactionTimestamp!: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, 100000000)
  public amount!: number;
}
