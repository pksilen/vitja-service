import { IdWrapper } from "../../../backk/Backk";

export default class OrderIdAndState extends IdWrapper {
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
