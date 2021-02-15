import { Module } from "@nestjs/common";
import AuthorizationService from "../backk/authorization/AuthorizationService";
import DefaultJwtAuthorizationServiceImpl from "../backk/authorization/DefaultJwtAuthorizationServiceImpl";
import CaptchaVerifyService from "../backk/captcha/CaptchaVerifyService";
import AbstractDbManager from "../backk/dbmanager/AbstractDbManager";
import ReadinessCheckService from "../backk/readinesscheck/ReadinessCheckService";
import CaptchaVerifierServiceImpl from "../services/captchaverify/CatpchaVerifyServiceImpl";
import OrdersService from "../services/orders/OrdersService";
import OrdersServiceImpl from "../services/orders/OrdersServiceImpl";
import ReadinessCheckServiceImpl from "../backk/readinesscheck/ReadinessCheckServiceImpl";
import SalesItemsService from "../services/salesitems/SalesItemsService";
import SalesItemsServiceImpl from "../services/salesitems/SalesItemsServiceImpl";
import ShoppingCartService from "../services/shoppingcart/ShoppingCartService";
import ShoppingCartServiceImpl from "../services/shoppingcart/ShoppingCartServiceImpl";
import UsersService from "../services/users/UsersService";
import UsersServiceImpl from "../services/users/UsersServiceImpl";
import { AppController } from "./app.controller";
import ResponseCacheConfigService from "../backk/cache/ResponseCacheConfigService";
import ResponseCacheConfigServiceImpl from "../services/responsecacheconfig/ResponseCacheConfigServiceImpl";
import AuditLoggingService from "../backk/observability/logging/audit/AuditLoggingService";
import AuditLoggingServiceImpl from "../services/auditlogging/AuditLoggingServiceImpl";
import TagsService from "../services/tags/TagsService";
import TagsServiceImpl from "../services/tags/TagsServiceImpl";
import { postgreSqlDbManager } from "../database/postgreSqlDbManager";
import { mongoDbManager } from "../database/mongoDbManager";
import { mySqlDbManager } from "../database/mySqlDatabaseManager";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: AbstractDbManager, useValue: mySqlDbManager },
    { provide: ResponseCacheConfigService, useClass: ResponseCacheConfigServiceImpl },
    { provide: AuditLoggingService, useClass: AuditLoggingServiceImpl },
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
    { provide: TagsService, useClass: TagsServiceImpl },
    { provide: UsersService, useClass: UsersServiceImpl },
    { provide: OrdersService, useClass: OrdersServiceImpl },
    { provide: ShoppingCartService, useClass: ShoppingCartServiceImpl }
  ]
})
export class AppModule {}
