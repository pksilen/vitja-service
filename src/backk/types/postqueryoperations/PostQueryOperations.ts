import { Projection } from "./Projection";
import { Paging } from "./Paging";
import { SortBys } from "./SortBys";

export interface PostQueryOperations extends Projection, SortBys, Paging {}
