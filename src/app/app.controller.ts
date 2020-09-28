import { Body, Controller, HttpCode, HttpStatus, Param, Post, Headers, Request } from "@nestjs/common";
import SalesItemsService from '../services/salesitems/SalesItemsService';
import UsersService from '../services/users/UsersService';
import OrdersService from '../services/orders/OrdersService';
import initializeController from '../backk/initializeController';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import executeServiceFunction from '../backk/executeServiceFunction';
import ReadinessCheckService from '../backk/ReadinessCheckService';
import CaptchaVerifyService from '../backk/captcha/CaptchaVerifyService';
import AuthorizationService from '../backk/authorization/AuthorizationService';

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
    return executeServiceFunction(this, params.serviceFunctionName, serviceFunctionArgument, authHeader);
  }
}
