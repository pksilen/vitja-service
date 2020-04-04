import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import MongodbSalesItemsServiceImpl from '../services/salesitems/MongoDbSalesItemsServiceImpl';
import UsersService from '../services/users/UsersService';
import MongoDbUsersServiceImpl from '../services/users/MongoDbUsersServiceImpl';
import MongoDbOrdersServiceImpl from '../services/orders/MongoDbOrdersServiceImpl';
import OrdersService from '../services/orders/OrdersService';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import MongoDbShoppingCartServiceImpl from '../services/shoppingcart/MongoDbShoppingCartServiceImpl';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: SalesItemsService, useClass: MongodbSalesItemsServiceImpl },
    { provide: UsersService, useClass: MongoDbUsersServiceImpl },
    { provide: OrdersService, useClass: MongoDbOrdersServiceImpl },
    { provide: ShoppingCartService, useClass: MongoDbShoppingCartServiceImpl }
  ]
})
export class AppModule {}
