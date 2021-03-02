import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res
} from "@nestjs/common";
import AuthorizationService from "../backk/authorization/AuthorizationService";
import CaptchaVerifyService from "../backk/captcha/CaptchaVerifyService";
import tryExecuteServiceMethod from "../backk/execution/tryExecuteServiceMethod";
import StartupCheckService from "../backk/service/startup/StartupCheckService";
import OrderService from "../services/order/OrderService";
import SalesItemService from "../services/salesitem/SalesItemService";
import ShoppingCartService from "../services/shoppingcart/ShoppingCartService";
import UserAccountService from "../services/useraccount/UserAccountService";
import ResponseCacheConfigService from "../backk/cache/ResponseCacheConfigService";
import AuditLoggingService from "../backk/observability/logging/audit/AuditLoggingService";
import initializeController from "../backk/controller/initializeController";
import TagService from "../services/tag/TagService";
import AbstractDbManager from "../backk/dbmanager/AbstractDbManager";
import UserService from "../services/user/UserService";

export let appController: any;

// noinspection JSUnusedLocalSymbols
@Controller()
export class AppController {
  constructor(
    dbManager: AbstractDbManager,
    private readonly captchaVerifyService: CaptchaVerifyService,
    private readonly startupService: StartupCheckService,
    private readonly responseCacheConfigService: ResponseCacheConfigService,
    private readonly auditLoggingService: AuditLoggingService,
    private readonly authorizationService: AuthorizationService,
    private readonly userAccountService: UserAccountService,
    private readonly userService: UserService,
    private readonly tagService: TagService,
    private readonly salesItemService: SalesItemService,
    private readonly shoppingCartService: ShoppingCartService,
    private readonly orderService: OrderService
  ) {
    appController = this;
    initializeController(appController, dbManager);
  }

  @Get(':serviceFunctionName')
  @HttpCode(HttpStatus.OK)
  processGetRequests(
    @Headers('authorization') authHeader: string,
    @Headers('x-forwarded-for') xForwardedForHeader: string,
    @Headers('if-none-match') ifNoneMatchHeader: string,
    @Param() params: { serviceFunctionName: string },
    @Query('arg') serviceFunctionArgument: object,
    @Res() response: any
  ) {
    // noinspection JSIgnoredPromiseFromCall
    return tryExecuteServiceMethod(
      this,
      params.serviceFunctionName,
      serviceFunctionArgument,
      {
        Authorization: authHeader,
        'X-Forwarded-For': xForwardedForHeader,
        'If-None-Match': ifNoneMatchHeader
      },
      response,
      {
        httpMethod: 'GET',
        allowedServiceFunctionsRegExpForHttpGetMethod: /^\w+\.get/
      }
    );
  }

  @Post(':serviceFunctionName')
  @HttpCode(HttpStatus.OK)
  processPostRequests(
    @Headers('authorization') authHeader: string,
    @Headers('x-forwarded-for') xForwardedForHeader: string,
    @Param() params: { serviceFunctionName: string },
    @Body() serviceFunctionArgument: object,
    @Res() response: any
  ) {
    // noinspection JSIgnoredPromiseFromCall
    return tryExecuteServiceMethod(
      this,
      params.serviceFunctionName,
      serviceFunctionArgument,
      {
        Authorization: authHeader,
        'X-Forwarded-For': xForwardedForHeader
      },
      response,
      {
        maxServiceFunctionCountInMultipleServiceFunctionExecution: 5,
        areMultipleServiceFunctionExecutionsAllowed: true,
        shouldAllowTemplatesInMultipleServiceFunctionExecution: true
      }
    );
  }
}
