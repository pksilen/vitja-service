import { Body, Controller, HttpCode, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { validateOrReject, ValidationError } from 'class-validator';
import SalesItemsService from '../services/salesitems/salesitems.service';
import UsersService from '../services/users/users.service';
import getFunctionParamNames from '../backk/getFunctionParamNames';
import OrdersService from '../services/orders/orders.service';

type Params = {
  serviceCall: string;
};

@Controller('vitja')
export class AppController {
  constructor(
    private readonly salesItemsService: SalesItemsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService
  ) {}

  @Post(':serviceCall')
  @HttpCode(200)
  async processRequests(@Param() params: Params, @Body() argObject: object): Promise<object | void> {
    const [serviceName, functionName] = params.serviceCall.split('.');
    const [firstParamName] = getFunctionParamNames((this as any)[serviceName][functionName]);
    const argObjectClassName = firstParamName.charAt(0).toUpperCase() + firstParamName.slice(1);
    const validatableObject = this.getValidatableObject(argObject, argObjectClassName, serviceName);

    try {
      await validateOrReject(validatableObject, { whitelist: true });
    } catch (validationErrors) {
      const errorStr = this.getValidationErrors(validationErrors);
      throw new HttpException(errorStr, HttpStatus.BAD_REQUEST);
    }

    return (this as any)[serviceName][functionName](validatableObject);
  }

  private getValidatableObject(object: object, objectClassName: any, serviceName: string): object {
    const validatableObject = new (this as any)[serviceName]['Types'][objectClassName]();

    return Object.entries(object).reduce((accumulatedArgs, [key, value]: [string, any]) => {
      let valueClassName = '';

      if (
        (!Array.isArray(value) && typeof value === 'object' && value !== null) ||
        (Array.isArray(value) && value.length > 0 && !Array.isArray(value[0]) && typeof value[0] === 'object')
      ) {
        valueClassName = key.charAt(0).toUpperCase() + key.slice(1, -1);
      }

      return Object.assign(accumulatedArgs, {
        [key]:
          valueClassName && Array.isArray(value)
            ? value.map((item: any) =>
                item !== null ? this.getValidatableObject(item, valueClassName, serviceName) : null
              )
            : valueClassName
            ? this.getValidatableObject(value, valueClassName, serviceName)
            : value
      });
    }, validatableObject);
  }

  private getValidationErrors(validationErrors: ValidationError[]): string {
    return validationErrors
      .map((validationError: ValidationError) => {
        if (validationError.constraints) {
          return Object.values(validationError.constraints)
            .map((constraint) => constraint)
            .join(', ');
        } else {
          return validationError.property + ': ' + this.getValidationErrors(validationError.children);
        }
      })
      .join(', ');
  }
}
