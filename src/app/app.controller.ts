import { Body, Controller, HttpCode, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { getFromContainer, MetadataStorage, validateOrReject, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import SalesItemsService from '../services/salesitems/salesitems.service';
import UsersService from '../services/users/users.service';
import OrdersService from '../services/orders/orders.service';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import initializeController from '../backk/initializeController';
import getServiceTypeNames from '../backk/getServiceTypeNames';
import { Service } from '../backk/service';

type Params = {
  serviceCall: string;
};

@Controller('vitja')
export class AppController {
  constructor(
    private readonly salesItemsService: SalesItemsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService
  ) {
    initializeController(this);
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
  }

  @Post('/metadata')
  processMetadataRequests(): any {
    return Object.entries(this)
      .filter(
        ([, propValue]: [string, any]) => typeof propValue === 'object' && propValue.constructor !== Object
      )
      .map(([serviceName]: [string, any]) => {
        const servicePrototype = Object.getPrototypeOf((this as any)[serviceName]);

        const functionNames = Object.getOwnPropertyNames(servicePrototype).filter(
          (ownPropertyName: string) => ownPropertyName !== 'constructor'
        );

        const functions = functionNames.map((functionName: string) => {
          const paramTypeName = (this as any)[`${serviceName}Types`].functionNameToParamTypeNameMap[
            functionName
          ];

          const returnValueTypeName = (this as any)[`${serviceName}Types`].functionNameToReturnTypeNameMap[
            functionName
          ];

          return {
            functionName,
            argType: paramTypeName,
            returnValueType: returnValueTypeName
          };
        });

        const types = Object.entries((this as any)[serviceName].Types).reduce(
          (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
            const typeObject = this.getTypeObject(typeClass);
            return { ...accumulatedTypes, [typeName]: typeObject };
          },
          {}
        );

        return {
          serviceName,
          functions,
          types: {
            ...types,
            ErrorResponse: {
              statusCode: 'integer',
              message: 'string'
            }
          }
        };
      });
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

  private getTypeObject(typeClass: Function): object {
    const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');
    const propNameToIsOptionalMap: { [key: string]: boolean } = {};
    const propNameToPropTypeMap: { [key: string]: string } = {};

    validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
      if (validationMetadata.type === 'conditionalValidation') {
        propNameToIsOptionalMap[validationMetadata.propertyName] = true;
      }

      switch (validationMetadata.type) {
        case 'isBoolean':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            'boolean' + (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
          break;
        case 'isNumber':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            'number' + (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
          break;
        case 'isString':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            'string' + (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
          break;
        case 'isInt':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            'integer' + (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
          break;
        case 'isIn':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            '(' +
            validationMetadata.constraints[0].map((value: any) => `'${value}'`).join('|') +
            ')' +
            (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
          break;
        case 'isInstance':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            validationMetadata.constraints[0].name +
            (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
          break;
        case 'isArray':
          propNameToPropTypeMap[validationMetadata.propertyName] =
            (propNameToPropTypeMap[validationMetadata.propertyName] ?? '') + '[]';
          break;
      }
    });

    return Object.entries(propNameToPropTypeMap).reduce((accumulatedTypeObject, [propName, propType]) => {
      return {
        ...accumulatedTypeObject,
        [propName]: propNameToIsOptionalMap[propName] ? '?' + propType : propType
      };
    }, {});
  }
}
