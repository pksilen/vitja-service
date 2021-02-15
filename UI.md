Header:
   - Service name / logo
   - Navigation: Sales Items, Shopping Cart
   - User account

shoppingCartService - @UiProperties(entityCount: 1)
tagsService - @UiProperties({ isShown: false )
ordersService - @UiProperties({ isShown: false )

Sales items:
    Tabs:
        - Sales Items  (getSalesItems)
          - List of sales items in user defined view type (list, grid) @UiProperties(defaultViewType: Grid)
          - double-click to view details
          - context actions: addToShoppingCart
        - My Sales Items (getSalesItemsByUserId)
          - Create sales item button in header
          - List of sales items in user defined view type
          - double click to view details, possibility to edit in details view
          - Context actions: edit, delete, addToShoppingCart
    updateSalesItemState (is for service internal use, no effect)

Shopping Cart: 
    Tabs: None
      - View directly details view of User's shopping cart or create it if not exists
      - Header: Empty shopping cart button
      - Context actions: remove from shopping cart
