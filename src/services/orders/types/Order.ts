import Entity from "../../../backk/Entity";
import OrderWithoutState from "./OrderWithoutState";

@Entity
export default class Order extends OrderWithoutState {
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
