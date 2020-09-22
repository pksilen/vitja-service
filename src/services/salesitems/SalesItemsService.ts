import { ErrorResponse, IdsAndOptPostQueryOps, IdWrapper } from '../../backk/Backk';
import SalesItemsFilters from './types/SalesItemsFilters';
import SalesItemCreateDto from './types/SalesItemCreateDto';
import { SalesItem } from './types/SalesItem';
import SalesItemUpdateDto from './types/SalesItemUpdateDto';
import SalesItemIdAndState from './types/SalesItemIdAndState';
import UserIdAndOptPostQueryOps from '../users/types/UserIdAndOptPostQueryOps';
import BaseService from '../../backk/BaseService';

export default abstract class SalesItemsService extends BaseService {
  readonly Types = {
    UserIdAndOptPostQueryOps,
    SalesItemsFilters,
    SalesItemCreateDto,
    SalesItemUpdateDto,
    SalesItemIdAndState,
    SalesItem
  };

  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(salesItemCreateDto: SalesItemCreateDto): Promise<IdWrapper | ErrorResponse>;
  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItemsByUserId(
    userIdAndOptPostQueryOps: UserIdAndOptPostQueryOps
  ): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItemsByIds(
    idsAndOptPostQueryOps: IdsAndOptPostQueryOps
  ): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse>;
  abstract updateSalesItem(salesItemUpdateDto: SalesItemUpdateDto): Promise<void | ErrorResponse>;

  abstract updateSalesItemState(
    salesItemIdAndState: SalesItemIdAndState,
    requiredCurrentState?: 'forSale' | 'sold'
  ): Promise<void | ErrorResponse>;

  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
