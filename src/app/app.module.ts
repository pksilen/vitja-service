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
import { postgreSqlDbManager } from '../database/postgreSqlDbManager';
import ReadinessCheckService from '../backk/ReadinessCheckService';
import ReadinessCheckServiceImpl from '../services/readinesscheck/ReadinessCheckServiceImpl';
import CaptchaVerifyService from '../backk/captcha/CaptchaVerifyService';
import CaptchaVerifierServiceImpl from '../services/captchaverify/CatpchaVerifyServiceImpl';
import AuthorizationService from '../backk/authorization/AuthorizationService';
import AuthorizationServiceImpl from '../services/authorization/AuthorizationServiceImpl';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: ReadinessCheckService, useClass: ReadinessCheckServiceImpl },
    { provide: CaptchaVerifyService, useClass: CaptchaVerifierServiceImpl },
    { provide: AuthorizationService, useClass: AuthorizationServiceImpl },
    { provide: SalesItemsService, useClass: SalesItemsServiceImpl },
    { provide: UsersService, useClass: UsersServiceImpl },
    { provide: OrdersService, useClass: OrdersServiceImpl },
    { provide: ShoppingCartService, useClass: ShoppingCartServiceImpl },
    { provide: AbstractDbManager, useValue: postgreSqlDbManager }
  ]
})
export class AppModule {}
