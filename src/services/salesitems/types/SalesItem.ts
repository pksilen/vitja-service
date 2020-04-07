import { IsInt } from 'class-validator';
import SalesItemWithoutId from './SalesItemWithoutId';
import { TestValueType } from '../../../backk/TestValueType';

export class SalesItem extends SalesItemWithoutId {
  _id!: string;

  @IsInt()
  @TestValueType('number')
  createdTimestampInMillis!: number;
}
