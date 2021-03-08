export const MAXIMUM_SALES_ITEM_COUNT_EXCEEDED = {
  errorCode: 'salesItemsService.1',
  errorMessage: 'Maximum sales item count exceeded. Maximum 100 active sales items allowed'
};

export const SALES_ITEM_UPDATE_FAILED_DUE_TO_STATE_NOT_FOR_SALE = {
  errorCode: 'salesItemsService.2',
  errorMessage: "Sales item update failed, because sales item state was not 'for sale'"
};

export const INVALID_SALES_ITEM_STATE = {
  errorCode: 'salesItemsService.3',
  errorMessage: 'Invalid sales item state'
};
