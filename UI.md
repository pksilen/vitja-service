Header:
   - Service name / logo
   - Navigation: Sales Items, Shopping Cart, Users
   - User Profile

shoppingCartService - @UiProperties(entityCount: 1)
tagsService - @UiProperties({ isShown: false )
ordersService - @UiProperties({ isShown: false )

Sales items:
    Tabs:
        - Sales Items  (getSalesItems)
          - List of sales items in user defined view type (list, grid) @UiProperties(defaultViewType: Grid)
          - double-click to view details
          - context actions: addToShoppingCart
    updateSalesItemState (is for service internal use, no effect)

Shopping Cart: 
    Tabs: None
      - View directly details view of User's shopping cart or create it if not exists
      - Header: Empty shopping cart button, Place order button
      - Context actions: remove from shopping cart

Order:
    header: button to delete order
    list of order items
     actions: remove order item
   -other functions not, because they are for vitjaLogistic or for tests only
    placeOrder should has gateway as input arg and create order with paymentinfo with gateway, then response:
    HTTP/1.1 301 Moved Permanently
    Location: https://payment-gateway/...?successUrl=https://backk-dynamic-frontend/?backk=OrdersService.payOrder?orderId=xxxx&failureUrl=https://backk-dynamic-frontend/?=backk=discardOrder&orderId=xxx
    paymentGateway adds query params to successUrl to indicate transactionId and amount
    payOrder updates order with paymentinfo: transactionId and amount
    discardOrder removes order by id


User:
   List users (list/grid)
   actions: follow user, unfollow user

User Profile:
    Tabs: General, Favorite Sales Items, Sales Items, Orders, Followed Users, Following Users
          General - Edit button, Delete button
            My Sales Items (getSalesItemsByUserId)
            - Create sales item button in header
            - Use tagsService to get possible tags and create new tag
            - List of sales items in user defined view type
            - double click to view details, possibility to edit in details view
            - Context actions: edit, delete
          Orders - double click to view
            - Order actions Delete 
             - OrderItems, actions: Delete
          Followed Users (actions: unfollow user)
          Following users (action: follow user, unfollow user)
