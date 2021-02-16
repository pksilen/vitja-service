import { ArrayMaxSize } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "./OrderItem";
import PaymentInfo from "./PaymentInfo";
import _IdAndVersionAndCreatedAtTimestamp
  from "../../../../backk/types/id/_IdAndVersionAndCreatedAtTimestamp";
import { Values } from "../../../../backk/constants/constants";

@Entity()
export default class Order extends _IdAndVersionAndCreatedAtTimestamp {
  public userId!: string;

  @ArrayMaxSize(Values._50)
  public orderItems!: OrderItem[];

  public paymentInfo!: PaymentInfo;
}
