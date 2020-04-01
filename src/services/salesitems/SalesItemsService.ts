import { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import { SalesItem } from './types/SalesItem';
import UserIdWrapper from '../users/types/UserIdWrapper';

export default abstract class SalesItemsService {
  readonly Types = {
    IdWrapper,
    IdsWrapper,
    SalesItemsFilters,
    SalesItemWithoutId,
    SalesItem,
    UserIdWrapper
  };

  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<Partial<SalesItem>[] | ErrorResponse>;
  abstract getSalesItemById({ _id }: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract getSalesItemsByUserId({ userId }: UserIdWrapper): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds({ _ids }: IdsWrapper): Promise<SalesItem[] | ErrorResponse>;
  abstract updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
