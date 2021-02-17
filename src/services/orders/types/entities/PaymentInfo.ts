import { IsAlphanumeric, IsNumber, MaxLength } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import Entity from "../../../../backk/decorators/entity/Entity";
import { IsExternalId } from "../../../../backk/decorators/typeproperty/IsExternalId";
import { Lengths, Values } from "../../../../backk/constants/constants";
import { PaymentGateway } from "../enum/PaymentGateway";

@Entity()
export default class PaymentInfo {
  public paymentGateway!: PaymentGateway;

  @MaxLength(Lengths._256)
  @IsAlphanumeric()
  @IsExternalId()
  public transactionId!: string | null;

  public transactionTimestamp!: Date | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, Values._1B)
  public amount!: number | null;
}
