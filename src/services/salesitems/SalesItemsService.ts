import { ErrorResponse, IdsAndPaging, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import { SalesItem } from './types/SalesItem';
import UserIdAndPaging from '../users/types/UserIdAndPaging';

export default abstract class SalesItemsService {
  readonly Types = {
    IdWrapper,
    IdsAndPaging,
    SalesItemsFilters,
    SalesItemWithoutId,
    SalesItem,
    UserIdAndPaging
  };

  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<Partial<SalesItem>[] | ErrorResponse>;
  abstract getSalesItemsByUserId({ userId }: UserIdAndPaging): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds({ _ids }: IdsAndPaging): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
