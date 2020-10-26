import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import AuthorizationService from '../backk/authorization/AuthorizationService';
import CaptchaVerifyService from '../backk/captcha/CaptchaVerifyService';
import tryExecuteServiceFunction from '../backk/service/tryExecuteServiceFunction';
import initializeController from '../backk/initializeController';
import ReadinessCheckService from '../backk/readinesscheck/ReadinessCheckService';
import OrdersService from '../services/orders/OrdersService';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import UsersService from '../services/users/UsersService';

// noinspection JSUnusedLocalSymbols
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

  @Post(':serviceFunctionName')
  @HttpCode(HttpStatus.OK)
  processRequests(
    @Headers('authorization') authHeader: string,
    @Param() params: { serviceFunctionName: string },
    @Body() serviceFunctionArgument: object
  ): Promise<object | void> {
    return tryExecuteServiceFunction(this, params.serviceFunctionName, serviceFunctionArgument, authHeader);
  }
}
