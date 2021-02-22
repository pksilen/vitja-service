export const ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED = {
  errorCode: 'orderService.1',
  errorMessage: 'Current order item state must be toBeDelivered'
}

export const INVALID_ORDER_ITEM_STATE = {
  errorCode: 'orderService.2',
  errorMessage: 'Invalid current order item state'
}

export const DELETE_ORDER_NOT_ALLOWED = {
  errorCode: 'orderService.3',
  errorMessage: 'Deleting order is not allowed when some or all of order items have been delivered'
}

export const ORDER_ALREADY_PAID = {
  errorCode: 'orderService.4',
  errorMessage: 'Order already paid'
}
