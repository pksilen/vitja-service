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
import StartupService from "../backk/service/startup/StartupService";
import OrdersService from "../services/orders/OrdersService";
import SalesItemsService from "../services/salesitems/SalesItemsService";
import ShoppingCartService from "../services/shoppingcart/ShoppingCartService";
import UsersService from "../services/users/UsersService";
import ResponseCacheConfigService from "../backk/cache/ResponseCacheConfigService";
import AuditLoggingService from "../backk/observability/logging/audit/AuditLoggingService";
import initializeController from "../backk/controller/initializeController";
import TagsService from "../services/tags/TagsService";
import AbstractDbManager from "../backk/dbmanager/AbstractDbManager";

export let appController: any;

// noinspection JSUnusedLocalSymbols
@Controller()
export class AppController {
  constructor(
    dbManager: AbstractDbManager,
    private readonly captchaVerifyService: CaptchaVerifyService,
    private readonly startupService: StartupService,
    private readonly responseCacheConfigService: ResponseCacheConfigService,
    private readonly auditLoggingService: AuditLoggingService,
    private readonly authorizationService: AuthorizationService,
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,
    private readonly salesItemsService: SalesItemsService,
    private readonly shoppingCartService: ShoppingCartService,
    private readonly ordersService: OrdersService
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
    @Headers('if-none-match') ifNoneMatchHeader: string,
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
        'X-Forwarded-For': xForwardedForHeader,
        'If-None-Match': ifNoneMatchHeader
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
