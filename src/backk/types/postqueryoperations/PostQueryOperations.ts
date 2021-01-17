import { Projection } from "./Projection";
import { Pagination } from "./Pagination";
import { SortBys } from "./SortBys";
import SubEntityPagination from "./SubEntityPagination";

export interface PostQueryOperations extends Projection, SortBys, Pagination {
  subPaginations?: SubEntityPagination[];
}
