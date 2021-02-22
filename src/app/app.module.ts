import { Module } from "@nestjs/common";
import AuthorizationService from "../backk/authorization/AuthorizationService";
import DefaultJwtAuthorizationServiceImpl from "../backk/authorization/DefaultJwtAuthorizationServiceImpl";
import CaptchaVerifyService from "../backk/captcha/CaptchaVerifyService";
import AbstractDbManager from "../backk/dbmanager/AbstractDbManager";
import StartupService from "../backk/service/startup/StartupService";
import CaptchaVerifierServiceImpl from "../services/captchaverify/CatpchaVerifyServiceImpl";
import OrderService from "../services/order/OrderService";
import OrderServiceImpl from "../services/order/OrderServiceImpl";
import StartupServiceImpl from "../backk/service/startup/StartupServiceImpl";
import SalesItemService from "../services/salesitem/SalesItemsService";
import SalesItemServiceImpl from "../services/salesitem/SalesItemsServiceImpl";
import ShoppingCartService from "../services/shoppingcart/ShoppingCartsService";
import ShoppingCartServiceImpl from "../services/shoppingcart/ShoppingCartsServiceImpl";
import UserAccountService from "../services/useraccount/UserAccountsService";
import UserAccountServiceImpl from "../services/useraccount/UserAccountsServiceImpl";
import { AppController } from "./app.controller";
import ResponseCacheConfigService from "../backk/cache/ResponseCacheConfigService";
import ResponseCacheConfigServiceImpl from "../services/responsecacheconfig/ResponseCacheConfigServiceImpl";
import AuditLoggingService from "../backk/observability/logging/audit/AuditLoggingService";
import AuditLoggingServiceImpl from "../services/auditlogging/AuditLoggingServiceImpl";
import TagService from "../services/tag/TagsService";
import TagServiceImpl from "../services/tag/TagsServiceImpl";
import { postgreSqlDbManager } from "../database/postgreSqlDbManager";
import { mongoDbManager } from "../database/mongoDbManager";
import { mySqlDbManager } from "../database/mySqlDatabaseManager";
import UserService from "../services/user/UsersService";
import UserServiceImpl from "../services/user/UsersServiceImpl";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: AbstractDbManager, useValue: mySqlDbManager },
    { provide: ResponseCacheConfigService, useClass: ResponseCacheConfigServiceImpl },
    { provide: AuditLoggingService, useClass: AuditLoggingServiceImpl },
    { provide: StartupService, useClass: StartupServiceImpl },
    { provide: CaptchaVerifyService, useClass: CaptchaVerifierServiceImpl },
    {
      provide: AuthorizationService,
      useValue: new DefaultJwtAuthorizationServiceImpl(
        process.env.JWT_SIGN_SECRET || 'abcdef',
        'userName',
        'roles'
      )
    },
    { provide: SalesItemService, useClass: SalesItemServiceImpl },
    { provide: TagService, useClass: TagServiceImpl },
    { provide: UserAccountService, useClass: UserAccountServiceImpl },
    { provide: UserService, useClass: UserServiceImpl },
    { provide: OrderService, useClass: OrderServiceImpl },
    { provide: ShoppingCartService, useClass: ShoppingCartServiceImpl }
  ]
})
export class AppModule {}
