import { IsInt } from 'class-validator';
import SalesItemWithoutId from './SalesItemWithoutId';
import { ExpectTestValueOfType } from '../../../backk/ExpectTestValueOfType';
import Entity from '../../../backk/Entity';

@Entity
export class SalesItem extends SalesItemWithoutId {
  _id!: string;

  @IsInt()
  @ExpectTestValueOfType('number')
  createdTimestampInMillis!: number;
}
