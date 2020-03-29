import { ErrorResponse, IdsWrapper, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import SalesItemWithoutId from './types/SalesItemWithoutId';
import { SalesItem } from './types/SalesItem';

export default abstract class SalesItemsService {
  readonly Types = {
    IdWrapper,
    IdsWrapper,
    SalesItemsFilters,
    SalesItemWithoutId,
    SalesItem
  };

  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<Partial<SalesItem>[] | ErrorResponse>;
  abstract getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract getSalesItemsByUserId(idWrapper: IdWrapper): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds(idsWrapper: IdsWrapper): Promise<SalesItem[] | ErrorResponse>;
  abstract createSalesItem(salesItemWithoutId: SalesItemWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract updateSalesItem(salesItem: SalesItem): Promise<void | ErrorResponse>;
  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
