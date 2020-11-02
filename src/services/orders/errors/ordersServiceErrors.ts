export const ORDER_ITEM_STATE_MUST_BE_TO_BE_DELIVERED = {
  errorCode: 'ordersService.1',
  errorMessage: 'Current order item state must be toBeDelivered'
}

export const INVALID_ORDER_ITEM_STATE = {
  errorCode: 'ordersService.2',
  errorMessage: 'Invalid current order item state'
}

export const DELETE_ORDER_NOT_ALLOWED = {
  errorCode: 'ordersService.3',
  errorMessage: 'Deleting order is not allowed when some or all of order items have been delivered'
}