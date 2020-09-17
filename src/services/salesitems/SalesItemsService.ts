import { ErrorResponse, IdsAndPaging, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import SalesItemWithoutIdAndCreatedTimestampAndState from './types/SalesItemWithoutIdAndCreatedTimestampAndState';
import { SalesItem } from './types/SalesItem';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import SalesItemWithoutCreatedTimestampAndState from './types/SalesItemWithoutCreatedTimestampAndState';
import SalesItemIdAndState from './types/SalesItemIdAndState';

export default abstract class SalesItemsService {
  readonly Types = {
    IdWrapper,
    IdsAndPaging,
    SalesItemsFilters,
    SalesItemWithoutIdAndCreatedTimestampAndState,
    SalesItemWithoutCreatedTimestampAndState,
    SalesItemIdAndState,
    SalesItem,
    UserIdAndPaging
  };

  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(
    salesItemWithoutIdAndCreatedTimestampAndState: SalesItemWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse>;
  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<Partial<SalesItem>[] | ErrorResponse>;
  abstract getSalesItemsByUserId({ userId }: UserIdAndPaging): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds({ _ids }: IdsAndPaging): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract updateSalesItem(
    salesItemWithoutCreatedTimestampAndState: SalesItemWithoutCreatedTimestampAndState
  ): Promise<void | ErrorResponse>;
  abstract updateSalesItemState(salesItemIdAndState: SalesItemIdAndState): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
