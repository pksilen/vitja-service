import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import { IsNumber } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import Entity from "../../../../backk/decorators/entity/Entity";

@Entity()
export default class PaymentInfo {
  public gatewayId!: string;
  public brokerId!: string;

  @MaxLengthAndMatches(64, /\d+/)
  public transactionUuid!: string;

  public transactionTimestamp!: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, 100000000)
  public amount!: number;
}
