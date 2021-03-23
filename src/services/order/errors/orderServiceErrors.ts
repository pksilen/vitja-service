export const orderServiceErrors = {
  cannotRemoveDeliveredOrderItem: {
    errorCode: 'orderService.1',
    message: 'Cannot remove delivered order item'
  },
  invalidOrderItemCurrentState: {
    errorCode: 'orderService.2',
    message: 'Cannot update order item state due to invalid current state'
  },
  deliveredOrderDeleteNotAllowed: {
    errorCode: 'orderService.3',
    message: 'Deleting order is not allowed when some or all of order items have been delivered'
  },
  orderAlreadyPaid: {
    errorCode: 'orderService.4',
    message: 'Order already paid'
  },
  orderItemAlreadyDelivered: {
    errorCode: 'orderService.5',
    message: 'Cannot deliver order item which is already delivered'
  },
  cannotUpdateOrderWhichIsNotPaid: {
    errorCode: 'orderService.4',
    message: 'Cannot update order which is not paid'
  },
  shoppingCartIsEmpty: {
    errorCode: 'orderService.4',
    message: 'Cannot place order because shopping cart is empty'
  },
};
