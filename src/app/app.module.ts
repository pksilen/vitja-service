import { Module } from '@nestjs/common';
import AuthorizationService from '../backk/authorization/AuthorizationService';
import DefaultJwtAuthorizationServiceImpl from '../backk/authorization/DefaultJwtAuthorizationServiceImpl';
import CaptchaVerifyService from '../backk/captcha/CaptchaVerifyService';
import AbstractDbManager from '../backk/dbmanager/AbstractDbManager';
import ReadinessCheckService from '../backk/readinesscheck/ReadinessCheckService';
import { postgreSqlDbManager } from '../database/postgreSqlDbManager';
import CaptchaVerifierServiceImpl from '../services/captchaverify/CatpchaVerifyServiceImpl';
import OrdersService from '../services/orders/OrdersService';
import OrdersServiceImpl from '../services/orders/OrdersServiceImpl';
import ReadinessCheckServiceImpl from '../services/readinesscheck/ReadinessCheckServiceImpl';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import SalesItemsServiceImpl from '../services/salesitems/SalesItemsServiceImpl';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import ShoppingCartServiceImpl from '../services/shoppingcart/ShoppingCartServiceImpl';
import UsersService from '../services/users/UsersService';
import UsersServiceImpl from '../services/users/UsersServiceImpl';
import { AppController } from './app.controller';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: AbstractDbManager, useValue: postgreSqlDbManager },
    { provide: ReadinessCheckService, useClass: ReadinessCheckServiceImpl },
    { provide: CaptchaVerifyService, useClass: CaptchaVerifierServiceImpl },
    {
      provide: AuthorizationService,
      useValue: new DefaultJwtAuthorizationServiceImpl(
        process.env.JWT_SIGN_SECRET || 'abcdef',
        'userName',
        'roles'
      )
    },
    { provide: SalesItemsService, useClass: SalesItemsServiceImpl },
    { provide: UsersService, useClass: UsersServiceImpl },
    { provide: OrdersService, useClass: OrdersServiceImpl },
    { provide: ShoppingCartService, useClass: ShoppingCartServiceImpl },
  ]
})
export class AppModule {}
