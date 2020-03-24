import { Body, Controller, HttpCode, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { validateOrReject, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import SalesItemsService from '../services/salesitems/salesitems.service';
import UsersService from '../services/users/users.service';
import OrdersService from '../services/orders/orders.service';
import initializeController from '../backk/initializeController';
import getServiceTypeNames from '../backk/getServiceTypeNames';
import { Service } from '../backk/service';
import generateServicesMetadata from '../backk/generateServicesMetadata';

type Params = {
  serviceCall: string;
};

@Controller()
export class AppController {
  constructor(
    private readonly salesItemsService: SalesItemsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService
  ) {
    Object.entries(this).forEach(([serviceName, service]: [string, Service]) => {
      const [functionNameToParamTypeNameMap, functionNameToReturnTypeNameMap] = getServiceTypeNames(
        serviceName,
        service.fileName
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
  async processRequests(@Param() params: Params, @Body() argObject: object): Promise<object | void> {
    const [serviceName, functionName] = params.serviceCall.split('.');

    const argObjectClassName = (this as any)[`${serviceName}Types`].functionNameToParamTypeNameMap[
      functionName
    ];

    const validatableObject = plainToClass(
      (this as any)[serviceName]['Types'][argObjectClassName],
      argObject
    );

    try {
      await validateOrReject(validatableObject as object, { whitelist: true });
    } catch (validationErrors) {
      const errorStr = this.getValidationErrors(validationErrors);
      throw new HttpException(errorStr, HttpStatus.BAD_REQUEST);
    }

    return (this as any)[serviceName][functionName](validatableObject);
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
