import { Body, Controller, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import SalesItemsService from "../services/salesitems/SalesItemsService";
import UsersService from "../services/users/UsersService";
import OrdersService from "../services/orders/OrdersService";
import initializeController from "../backk/initializeController";
import ShoppingCartService from "../services/shoppingcart/ShoppingCartService";
import executeServiceCall from "../backk/executeServiceCall";
import ReadinessCheckService from "../services/readinesscheck/ReadinessCheckService";

// noinspection JSUnusedLocalSymbols
@Controller()
export class AppController {
  constructor(
    private readonly readinessCheckService: ReadinessCheckService,
    private readonly usersService: UsersService,
    private readonly salesItemsService: SalesItemsService,
    private readonly shoppingCartService: ShoppingCartService,
    private readonly ordersService: OrdersService
  ) {
    initializeController(this);
  }

  @Post(':serviceCall')
  @HttpCode(HttpStatus.OK)
  async processRequests(
    @Param() params: { serviceCall: string },
    @Body() serviceCallArgument: object
  ): Promise<object | void> {
    return executeServiceCall(this, params.serviceCall, serviceCallArgument);
  }
}
