import { IsInt, IsNumber, Max, Min } from 'class-validator';
import UpdateSalesItemArg from '../args/UpdateSalesItemArg';
import Entity from '../../../../backk/annotations/entity/Entity';
import { ExpectInTestsToMatch } from '../../../../backk/ExpectInTestsToMatch';

@Entity
export class SalesItem extends UpdateSalesItemArg {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-1)
  @Max(1000000000)
  previousPrice!: number;

  state!: 'forSale' | 'sold';

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectInTestsToMatch(
    'createdTimestampInSecs <= Math.round(Date.now() / 1000) && createdTimestampInSecs > Math.round((Date.now() / 1000) - 60)'
  )
  createdTimestampInSecs!: number;
}
