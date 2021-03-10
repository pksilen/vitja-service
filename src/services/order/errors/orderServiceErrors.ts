export const orderServiceErrors = {
  cannotDeleteOrderItemWhichIsAlreadyDelivered: {
    errorCode: 'orderService.1',
    message: 'Cannot delete order item which is already delivered'
  },
  cannotUpdateOrderItemStateDueToInvalidCurrentState: {
    errorCode: 'orderService.2',
    message: 'Cannot update order item state due to invalid current state'
  },
  deleteOrderNotAllowed: {
    errorCode: 'orderService.3',
    message: 'Deleting order is not allowed when some or all of order items have been delivered'
  },
  orderAlreadyPaid: {
    errorCode: 'orderService.4',
    message: 'Order already paid'
  },
  cannotDeliverOrderWhichIsAlreadyDelivered: {
    errorCode: 'orderService.5',
    message: 'cannot deliver order which is already delivered'
  }
};
