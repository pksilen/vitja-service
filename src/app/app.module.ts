import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import SalesItemsServiceImpl from '../services/salesitems/SalesItemsServiceImpl';
import UsersService from '../services/users/UsersService';
import UsersServiceImpl from '../services/users/UsersServiceImpl';
import OrdersServiceImpl from '../services/orders/OrdersServiceImpl';
import OrdersService from '../services/orders/OrdersService';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import ShoppingCartServiceImpl from '../services/shoppingcart/ShoppingCartServiceImpl';
import AbstractDbManager from '../backk/dbmanager/AbstractDbManager';
import { postgreSqlDbManager } from "../database/postgreSqlDbManager";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: SalesItemsService, useClass: SalesItemsServiceImpl },
    { provide: UsersService, useClass: UsersServiceImpl },
    { provide: OrdersService, useClass: OrdersServiceImpl },
    { provide: ShoppingCartService, useClass: ShoppingCartServiceImpl },
    { provide: AbstractDbManager, useValue: postgreSqlDbManager }
  ]
})
export class AppModule {}
