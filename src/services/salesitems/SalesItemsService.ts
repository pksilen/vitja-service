import BaseService from '../../backk/service/basetypes/BaseService';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import CreateSalesItemArg from './types/args/CreateSalesItemArg';
import GetSalesItemsArg from './types/args/GetSalesItemsArg';
import UpdateSalesItemArg from './types/args/UpdateSalesItemArg';
import UpdateSalesItemStateArg from './types/args/UpdateSalesItemStateArg';
import { SalesItem } from './types/entities/SalesItem';
import IdAndUserId from "../../backk/types/IdAndUserId";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import IdsAndOptPostQueryOps from "../../backk/types/IdsAndOptPostQueryOps";
import _Id from "../../backk/types/_Id";
import SortBy from "../../backk/types/SortBy";

export default abstract class SalesItemsService extends BaseService {
  readonly Types = {
    GetByUserIdArg,
    GetSalesItemsArg,
    CreateSalesItemArg,
    UpdateSalesItemArg,
    UpdateSalesItemStateArg,
    SalesItem,
    SortBy
  };

  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;
  abstract createSalesItem(arg: CreateSalesItemArg): Promise<SalesItem | ErrorResponse>;
  abstract getSalesItems(arg: GetSalesItemsArg): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByUserId(arg: GetByUserIdArg): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemsByIds(arg: IdsAndOptPostQueryOps): Promise<SalesItem[] | ErrorResponse>;
  abstract getSalesItemById(arg: _Id): Promise<SalesItem | ErrorResponse>;
  abstract updateSalesItem(arg: UpdateSalesItemArg): Promise<void | ErrorResponse>;

  abstract updateSalesItemState(
    arg: UpdateSalesItemStateArg,
    requiredCurrentState?: 'forSale' | 'sold'
  ): Promise<void | ErrorResponse>;

  abstract deleteSalesItemById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
