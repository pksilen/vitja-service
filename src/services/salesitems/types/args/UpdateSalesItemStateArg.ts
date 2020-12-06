import { SalesItemState } from '../enums/SalesItemState';
import _Id from '../../../../backk/types/id/_Id';

export default class UpdateSalesItemStateArg extends _Id {
  newState!: SalesItemState;
}
