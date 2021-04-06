import { Module } from "@nestjs/common";
import AuthorizationService from "../backk/authorization/AuthorizationService";
import DefaultJwtAuthorizationServiceImpl from "../backk/authorization/DefaultJwtAuthorizationServiceImpl";
import CaptchaVerifyService from "../backk/captcha/CaptchaVerifyService";
import AbstractDbManager from "../backk/dbmanager/AbstractDbManager";
import StartupCheckService from "../backk/service/startup/StartupCheckService";
import CaptchaVerifierServiceImpl from "../services/captchaverify/CatpchaVerifyServiceImpl";
import OrderService from "../services/order/OrderService";
import OrderServiceImpl from "../services/order/OrderServiceImpl";
import StartupCheckServiceImpl from "../backk/service/startup/StartupCheckServiceImpl";
import SalesItemService from "../services/salesitem/SalesItemService";
import SalesItemServiceImpl from "../services/salesitem/SalesItemServiceImpl";
import ShoppingCartService from "../services/shoppingcart/ShoppingCartService";
import ShoppingCartServiceImpl from "../services/shoppingcart/ShoppingCartServiceImpl";
import UserAccountService from "../services/useraccount/UserAccountService";
import UserAccountServiceImpl from "../services/useraccount/UserAccountServiceImpl";
import { AppController } from "./app.controller";
import ResponseCacheConfigService from "../backk/cache/ResponseCacheConfigService";
import ResponseCacheConfigServiceImpl from "../services/responsecacheconfig/ResponseCacheConfigServiceImpl";
import AuditLoggingService from "../backk/observability/logging/audit/AuditLoggingService";
import AuditLoggingServiceImpl from "../services/auditlogging/AuditLoggingServiceImpl";
import TagService from "../services/tag/TagService";
import TagServiceImpl from "../services/tag/TagServiceImpl";
import { postgreSqlDbManager } from "../database/postgreSqlDbManager";
import UserService from "../services/user/UserService";
import UserServiceImpl from "../services/user/UserServiceImpl";
import { mySqlDbManager } from "../database/mySqlDatabaseManager";
import { mongoDbManager } from "../database/mongoDbManager";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    { provide: AbstractDbManager, useValue: postgreSqlDbManager },
    { provide: ResponseCacheConfigService, useClass: ResponseCacheConfigServiceImpl },
    { provide: AuditLoggingService, useClass: AuditLoggingServiceImpl },
    { provide: StartupCheckService, useClass: StartupCheckServiceImpl },
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
