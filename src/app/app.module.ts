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
import DbManager from '../backk/dbmanager/DbManager';
import MongoDbManager from '../backk/dbmanager/MongoDbManager';
import PostgreSqlDbManager from '../backk/dbmanager/PostgreSqlDbManager';

const MONGO_DB_URI = 'mongodb+srv://admin:admin@vitja-tjdze.mongodb.net/test?retryWrites=true&w=majority';
const mongoDbManager = new MongoDbManager(MONGO_DB_URI, 'vitja');

const POSTGRES_SCHEMA = 'public';
const POSTGRES_USER = 'postgres';
const POSTGRES_HOST = '127.0.0.1';
const POSTGRES_DATABASE = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_PORT = 5432;
const postgreSqlDbManager = new PostgreSqlDbManager(
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  POSTGRES_SCHEMA
);

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: SalesItemsService, useClass: MongodbSalesItemsServiceImpl },
    { provide: UsersService, useClass: MongoDbUsersServiceImpl },
    { provide: OrdersService, useClass: MongoDbOrdersServiceImpl },
    { provide: ShoppingCartService, useClass: MongoDbShoppingCartServiceImpl },
    { provide: DbManager, useValue: mongoDbManager }
  ]
})
export class AppModule {}
