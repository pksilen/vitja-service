import { IsInt, Max, MaxLength, Min } from "class-validator";
import SalesItemWithoutId from './SalesItemWithoutId';
import { ExpectAnyValueInTests } from '../../../backk/ExpectAnyValueInTests';
import Entity from '../../../backk/Entity';

@Entity
export class SalesItem extends SalesItemWithoutId {
  @MaxLength(24)
  _id!: string;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  createdTimestampInSecs!: number;
}
