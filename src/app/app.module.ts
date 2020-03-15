import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import SalesItemsService from '../services/salesitems/salesitems.service';
import MongodbSalesItemsServiceImpl from '../services/salesitems/mongodb.salesItems.service.impl';
import UsersService from '../services/users/users.service';
import MongodbUsersServiceImpl from '../services/users/mongodb.users.service.impl';
import MongoDbOrdersServiceImpl from '../services/orders/mongodb.orders.service.impl';
import OrdersService from '../services/orders/orders.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: SalesItemsService, useClass: MongodbSalesItemsServiceImpl },
    { provide: UsersService, useClass: MongodbUsersServiceImpl },
    { provide: OrdersService, useClass: MongoDbOrdersServiceImpl}
  ]
})
export class AppModule {}
