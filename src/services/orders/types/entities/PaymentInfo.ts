import MaxLengthAndMatches from "../../../../backk/decorators/typeproperty/MaxLengthAndMatches";
import { IsNumber } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import Entity from "../../../../backk/decorators/entity/Entity";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

@Entity()
export default class PaymentInfo {
  @TestValue('1')
  public gatewayId!: string;
  
  @TestValue('1')
  public brokerId!: string;

  @MaxLengthAndMatches(64, /[a-zA-Z\d]+/)
  public transactionUuid!: string;

  public transactionTimestamp!: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, 100000000)
  public amount!: number;
}
