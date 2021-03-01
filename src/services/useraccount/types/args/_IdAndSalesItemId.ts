import _IdAndDefaultPostQueryOperations
  from "../../../../backk/types/postqueryoperations/_IdAndDefaultPostQueryOperations";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndSalesItemId extends _IdAndDefaultPostQueryOperations {
  salesItemId!: string;
  includeResponseFields: string[] = ['favoriteSalesItems']
}
