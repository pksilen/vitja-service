import { MaxLength } from 'class-validator';
import OrderIdAndOrderItemId from './OrderIdAndOrderItemId';

export default class OrderIdAndOrderItemIdAndUserId extends OrderIdAndOrderItemId {
  @MaxLength(24)
  userId!: string;
}
