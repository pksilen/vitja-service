export const salesItemServiceErrors = {
  maximumSalesItemCountPerUserExceeded: {
    errorCode: 'salesItemsService.1',
    message: 'Maximum sales item count exceeded. Maximum 100 active sales items allowed'
  },
  updateFailedBecauseSalesItemStateIsNotForSale: {
    errorCode: 'salesItemsService.2',
    message: "Sales item update failed, because sales item state was not 'for sale'"
  },
  invalidSalesItemState: {
    errorCode: 'salesItemsService.3',
    message: 'Invalid sales item state'
  }
};
