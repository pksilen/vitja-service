import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "./OrderItem";
import PaymentInfo from "./PaymentInfo";
import { Values } from "../../../../backk/constants/constants";
import _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp";

@Entity()
export default class Order extends _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp {
  public userId!: string;

  @ArrayMinSize(1)
  @ArrayMaxSize(Values._50)
  public orderItems!: OrderItem[];

  public paymentInfo!: PaymentInfo;
}
