export const shoppingCartServiceErrors = {
  shoppingCartAlreadyExists: {
    errorCode: 'shoppingCartService.1',
    message: 'Shopping cart already exists. Only one shopping cart is allowed'
  },
  salesItemReservedOrSold: {
    errorCode: 'shoppingCartService.2',
    message: "Sales item is either reserved in another user's shopping cart or already sold"
  }
};
