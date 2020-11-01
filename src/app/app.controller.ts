import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import AuthorizationService from '../backk/authorization/AuthorizationService';
import CaptchaVerifyService from '../backk/captcha/CaptchaVerifyService';
import tryExecuteServiceFunction from '../backk/execution/tryExecuteServiceFunction';
import initializeController from '../backk/initialization/initializeController';
import ReadinessCheckService from '../backk/readinesscheck/ReadinessCheckService';
import OrdersService from '../services/orders/OrdersService';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import UsersService from '../services/users/UsersService';

// noinspection JSUnusedLocalSymbols,OverlyComplexFunctionJS
@Controller()
export class AppController {
  constructor(
    private readonly captchaVerifyService: CaptchaVerifyService,
    private readonly readinessCheckService: ReadinessCheckService,
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
    @Param() params: { serviceFunctionName: string },
    @Query('arg') serviceFunctionArgument: object
  ): Promise<object | void> {
    return tryExecuteServiceFunction(this, params.serviceFunctionName, serviceFunctionArgument, authHeader, {
      httpMethod: 'GET'
    });
  }

  @Post(':serviceFunctionName')
  @HttpCode(HttpStatus.OK)
  processPostRequests(
    @Headers('authorization') authHeader: string,
    @Param() params: { serviceFunctionName: string },
    @Body() serviceFunctionArgument: object
  ): Promise<object | void> {
    return tryExecuteServiceFunction(this, params.serviceFunctionName, serviceFunctionArgument, authHeader);
  }
}
