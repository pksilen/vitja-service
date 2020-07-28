import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  Response
} from '@nestjs/common';
import { validateOrReject, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import SalesItemsService from '../services/salesitems/SalesItemsService';
import UsersService from '../services/users/UsersService';
import OrdersService from '../services/orders/OrdersService';
import initializeController from '../backk/initializeController';
import getServiceTypeNames from '../backk/getServiceTypeNames';
import generateServicesMetadata from '../backk/generateServicesMetadata';
import getSrcFilenameForTypeName from '../backk/getSrcFilenameForTypeName';
import ShoppingCartService from '../services/shoppingcart/ShoppingCartService';

type Params = {
  serviceCall: string;
};

@Controller()
export class AppController {
  constructor(
    private readonly usersService: UsersService,
    private readonly salesItemsService: SalesItemsService,
    private readonly shoppingCartService: ShoppingCartService,
    private readonly ordersService: OrdersService
  ) {
    Object.entries(this).forEach(([serviceName]: [string, object]) => {
      const [functionNameToParamTypeNameMap, functionNameToReturnTypeNameMap] = getServiceTypeNames(
        serviceName,
        getSrcFilenameForTypeName(serviceName.charAt(0).toUpperCase() + serviceName.slice(1))
      );

      (this as any)[`${serviceName}Types`] = {
        functionNameToParamTypeNameMap,
        functionNameToReturnTypeNameMap
      };
    });

    initializeController(this);
  }

  @Post('/metadata')
  processMetadataRequests(): any {
    return generateServicesMetadata(this);
  }

  @Post(':serviceCall')
  @HttpCode(200)
  async processRequests(@Param() params: Params, @Body() paramObject: object): Promise<object | void> {
    const [serviceName, functionName] = params.serviceCall.split('.');
    const paramObjectTypeName = (this as any)[`${serviceName}Types`].functionNameToParamTypeNameMap[
      functionName
    ];

    let validatableParamObject;
    if (paramObjectTypeName) {
      validatableParamObject = plainToClass(
        (this as any)[serviceName]['Types'][paramObjectTypeName],
        paramObject
      );

      try {
        await validateOrReject(validatableParamObject as object, {
          whitelist: true,
          forbidNonWhitelisted: true
        });
      } catch (validationErrors) {
        const errorStr = this.getValidationErrors(validationErrors);
        throw new HttpException(errorStr, HttpStatus.BAD_REQUEST);
      }
    }

    const response = await (this as any)[serviceName][functionName](validatableParamObject);

    if (response && response.statusCode && response.errorMessage) {
      throw new HttpException(response, response.statusCode);
    }

    return response;
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
