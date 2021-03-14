import { ArrayMaxSize, ArrayMinSize, IsAlphanumeric, IsNumber, MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "./OrderItem";
import { Lengths, Values } from "../../../../backk/constants/constants";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId";
import { OneToMany } from "../../../../backk/decorators/typeproperty/OneToMany";
import { PaymentGateway } from "../enum/PaymentGateway";
import { IsExternalId } from "../../../../backk/decorators/typeproperty/IsExternalId";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";

@Entity()
export default class Order extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestampAndUserAccountId {
  @ArrayMinSize(1)
  @ArrayMaxSize(Values._50)
  @OneToMany()
  public orderItems!: OrderItem[];

  public paymentGateway: PaymentGateway = 'Paytrail';

  @MaxLength(Lengths._256)
  @IsAlphanumeric()
  @IsExternalId()
  public transactionId!: string | null;

  public transactionTimestamp!: Date | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @MinMax(0, Values._1B)
  public amount!: number | null;
}
