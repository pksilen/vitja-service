import {
  ErrorResponse,
  IdsAndOptionalPostQueryOperations,
  IdWrapper
} from "../../backk/Backk";
import SalesItemsFilters from "./types/SalesItemsFilters";
import SalesItemWithoutIdAndCreatedTimestampAndState
  from "./types/SalesItemWithoutIdAndCreatedTimestampAndState";
import { SalesItem } from "./types/SalesItem";
import SalesItemWithoutCreatedTimestampAndState from "./types/SalesItemWithoutCreatedTimestampAndState";
import SalesItemIdAndState from "./types/SalesItemIdAndState";
import UserIdAndOptionalPostQueryOperations from "../users/types/UserIdAndOptionalPostQueryOperations";

export default abstract class SalesItemsService {
  readonly Types = {
    IdWrapper,
    UserIdAndOptionalPostQueryOperations,
    IdsAndOptionalPostQueryOperations,
    SalesItemsFilters,
    SalesItemWithoutIdAndCreatedTimestampAndState,
    SalesItemWithoutCreatedTimestampAndState,
    SalesItemIdAndState,
    SalesItem
  };

  abstract deleteAllSalesItems(): Promise<void | ErrorResponse>;

  abstract createSalesItem(
    salesItemWithoutIdAndCreatedTimestampAndState: SalesItemWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse>;

  abstract getSalesItems(salesItemsFilters: SalesItemsFilters): Promise<Partial<SalesItem>[] | ErrorResponse>;

  abstract getSalesItemsByUserId(
    userIdAndPostQueryOperations: UserIdAndOptionalPostQueryOperations
  ): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItemsByIds(
    idsAndOptionalPostQueryOperations: IdsAndOptionalPostQueryOperations
  ): Promise<SalesItem[] | ErrorResponse>;

  abstract getSalesItemById(idWrapper: IdWrapper): Promise<SalesItem | ErrorResponse>;

  abstract updateSalesItem(
    salesItemWithoutCreatedTimestampAndState: SalesItemWithoutCreatedTimestampAndState
  ): Promise<void | ErrorResponse>;

  abstract updateSalesItemState(
    salesItemIdAndState: SalesItemIdAndState,
    requiredCurrentState: undefined | 'forSale' | 'sold'
  ): Promise<void | ErrorResponse>;

  abstract deleteSalesItemById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
