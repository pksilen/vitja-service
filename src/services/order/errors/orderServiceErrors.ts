export const orderServiceErrors = {
  cannotRemoveOrderItemWhichIsAlreadyDelivered: {
    errorCode: 'orderService.1',
    message: 'Cannot remove order item which is already delivered'
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
  cannotDeliverOrderItemWhichIsAlreadyDelivered: {
    errorCode: 'orderService.5',
    message: 'Cannot deliver order item which is already delivered'
  },
  cannotUpdateOrderWhichIsNotPaid: {
    errorCode: 'orderService.4',
    message: 'Cannot update order which is not paid'
  },
  cannotPlaceOrderBecauseShoppingCartIsEmpty: {
    errorCode: 'orderService.4',
    message: 'Cannot place order because shopping cart is empty'
  },
};
