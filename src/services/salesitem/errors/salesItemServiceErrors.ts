export const salesItemServiceErrors = {
  maximumSalesItemCountPerUserExceeded: {
    errorCode: 'salesItemsService.1',
    errorMessage: 'Maximum sales item count exceeded. Maximum 100 active sales items allowed'
  },
  updateFailedBecauseSalesItemStateIsNotForSale: {
    errorCode: 'salesItemsService.2',
    errorMessage: "Sales item update failed, because sales item state was not 'for sale'"
  },
  invalidSalesItemState: {
    errorCode: 'salesItemsService.3',
    errorMessage: 'Invalid sales item state'
  }
};
