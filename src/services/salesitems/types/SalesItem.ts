import { IsInt, Max, MaxLength, Min } from "class-validator";
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import classes from "extends-classes";
import SalesItemWithoutId from './SalesItemWithoutId';
import { ExpectTestValueOfType } from '../../../backk/ExpectTestValueOfType';
import Entity from '../../../backk/Entity';

@Entity
export class SalesItem extends SalesItemWithoutId {
  @MaxLength(24)
  _id!: string;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectTestValueOfType('number')
  createdTimestampInSecs!: number;
}
