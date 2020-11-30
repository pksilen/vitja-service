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
} from '@nestjs/common';
import AuthorizationService from '../backk/authorization/AuthorizationService';
import CaptchaVerifyService from '../backk/captcha/CaptchaVerifyService';
import tryExecuteServiceFunction from '../backk/execution/tryExecuteServiceFunction';
import ReadinessCheckService from '../backk/readinesscheck/ReadinessCheckService';
import OrdersService from '../services/orders/OrdersService';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import UsersService from '../services/users/UsersService';
import ResponseCacheConfigService from '../backk/cache/ResponseCacheConfigService';
import AuditLoggingService from '../backk/observability/logging/audit/AuditLoggingService';
import initializeController from '../backk/controller/initializeController';
import { postgreSqlDbManager } from "../database/postgreSqlDbManager";
import executeScheduledCronJobs from "../backk/scheduling/executeScheduledCronJobs";

// noinspection JSUnusedLocalSymbols,OverlyComplexFunctionJS
@Controller()
export class AppController {
  constructor(
    private readonly captchaVerifyService: CaptchaVerifyService,
    private readonly readinessCheckService: ReadinessCheckService,
    private readonly responseCacheConfigService: ResponseCacheConfigService,
    private readonly auditLoggingService: AuditLoggingService,
    private readonly authorizationService: AuthorizationService,
    private readonly usersService: UsersService,
    private readonly salesItemsService: SalesItemsService,
    private readonly shoppingCartService: ShoppingCartService,
    private readonly ordersService: OrdersService
  ) {
    initializeController(this);
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
    tryExecuteServiceFunction(
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
    tryExecuteServiceFunction(
      this,
      params.serviceFunctionName,
      serviceFunctionArgument,
      {
        Authorization: authHeader,
        'X-Forwarded-For': xForwardedForHeader,
        'If-None-Match': ifNoneMatchHeader
      },
      response
    );
  }
}
