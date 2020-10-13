import { MaxLength } from 'class-validator';
import { Id } from '../../../../backk/Backk';

export default class OrderIdAndOrderItemId extends Id {
  @MaxLength(24)
  orderItemId!: string;
}
