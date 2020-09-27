import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import UsersService from '../services/users/UsersService';
import OrdersService from '../services/orders/OrdersService';
import initializeController from '../backk/initializeController';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';
import executeServiceFunction from '../backk/executeServiceFunction';
import ReadinessCheckService from '../backk/ReadinessCheckService';
import CaptchaVerifierService from "../backk/captcha/CaptchaVerifierService";

// noinspection JSUnusedLocalSymbols
@Controller()
export class AppController {
  constructor(
    private readonly captchaVerifierService: CaptchaVerifierService,
    private readonly readinessCheckService: ReadinessCheckService,
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
    @Param() params: { serviceFunctionName: string },
    @Body() serviceFunctionArgument: object
  ): Promise<object | void> {
    return executeServiceFunction(this, params.serviceFunctionName, serviceFunctionArgument);
  }
}
