import { OptionalProjection } from "./OptionalProjection";
import { Paging } from "./Paging";
import { ISortBy } from "./ISortBy";

export interface PostQueryOps extends OptionalProjection, Paging {
  sortBys: ISortBy[];
}
