export const orderServiceErrors = {
  cannotDeleteOrderItemWhichIsAlreadyDelivered: {
    errorCode: 'orderService.1',
    errorMessage: 'Cannot delete order item which is already delivered'
  },
  cannotUpdateOrderItemStateDueToInvalidCurrentState: {
    errorCode: 'orderService.2',
    errorMessage: 'Cannot update order item state due to invalid current state'
  },
  deleteOrderNotAllowed: {
    errorCode: 'orderService.3',
    errorMessage: 'Deleting order is not allowed when some or all of order items have been delivered'
  },
  orderAlreadyPaid: {
    errorCode: 'orderService.4',
    errorMessage: 'Order already paid'
  },
  cannotDeliverOrderWhichIsAlreadyDelivered: {
    errorCode: 'orderService.5',
    errorMessage: 'cannot deliver order which is already delivered'
  }
};
