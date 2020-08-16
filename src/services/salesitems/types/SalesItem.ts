import { IsInt, Max, Min } from "class-validator";
import SalesItemWithoutId from './SalesItemWithoutId';
import { ExpectTestValueOfType } from '../../../backk/ExpectTestValueOfType';
import Entity from '../../../backk/Entity';

@Entity
export class SalesItem extends SalesItemWithoutId {
  _id!: string;

  @IsInt()
  @Min(0)
  @Max(2147483647 )
  @ExpectTestValueOfType('number')
  createdTimestampInSecs!: number;
}
