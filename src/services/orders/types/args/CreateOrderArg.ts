import { MaxLength } from 'class-validator';

export default class CreateOrderArg {
  @MaxLength(24)
  userId!: string;

  @MaxLength(24, { each: true })
  salesItemIds!: string[];
}
