import { IsInt } from 'class-validator';
import SalesItemWithoutId from './SalesItemWithoutId';

export class SalesItem extends SalesItemWithoutId {
  _id!: string;

  @IsInt()
  createdTimestampInMillis!: number;
}
