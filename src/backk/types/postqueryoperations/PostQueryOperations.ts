import { Projection } from "./Projection";
import { Pagination } from "./Pagination";
import { SortBys } from "./SortBys";
import SubPagination from "./SubPagination";

export interface PostQueryOperations extends Projection, SortBys, Pagination {
  subPaginations?: SubPagination[];
}
