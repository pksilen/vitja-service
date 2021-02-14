import { ArrayMaxSize } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "./OrderItem";
import PaymentInfo from "./PaymentInfo";
import _IdAndVersionAndCreatedAtTimestamp
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestamp";

@Entity()
export default class Order extends _IdAndVersionAndCreatedAtTimestamp {
  public userId!: string;

  @ArrayMaxSize(50)
  public orderItems!: OrderItem[];

  public paymentInfo!: PaymentInfo;
}
