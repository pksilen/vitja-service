import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

export function getTypeMetadata<T>(typeClass: new () => T): object {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');
  const propNameToIsOptionalMap: { [key: string]: boolean } = {};
  const propNameToPropTypeMap: { [key: string]: string } = {};
  const propNameToDefaultValueMap: { [key: string]: any } = {};

  const typeObject = new typeClass();
  Object.entries(typeObject).forEach(([propName, defaultValue]: [string, any]) => {
    propNameToDefaultValueMap[propName] = defaultValue;
  });

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
      [propName]:
        (propNameToIsOptionalMap[propName] ? '?' + propType : propType) +
        (propNameToDefaultValueMap[propName] === undefined
          ? ''
          : ` = ${JSON.stringify(propNameToDefaultValueMap[propName])}`)
    };
  }, {});
}

function getValidationMetadata<T>(typeClass: new () => T): object {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');
  const propNameToValidationsMap: { [key: string]: string[] } = {};

  // noinspection FunctionWithMoreThanThreeNegationsJS
  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    if (
      validationMetadata.type !== 'conditionalValidation' &&
      validationMetadata.type !== 'nestedValidation' &&
      validationMetadata.type !== 'isBoolean' &&
      validationMetadata.type !== 'isBoolean' &&
      (validationMetadata.type !== 'isNumber' ||
        (validationMetadata.type === 'isNumber' && validationMetadata.constraints?.[0])) &&
      validationMetadata.type !== 'isString' &&
      validationMetadata.type !== 'isInt' &&
      validationMetadata.type !== 'isIn' &&
      validationMetadata.type !== 'isInstance' &&
      validationMetadata.type !== 'isArray'
    ) {
      const validationExpr = `${validationMetadata.type}${
        validationMetadata.constraints?.[0] !== undefined
          ? '(' +
            (typeof validationMetadata.constraints[0] === 'object' &&
            !(validationMetadata.constraints[0] instanceof RegExp)
              ? JSON.stringify(validationMetadata.constraints[0])
              : validationMetadata.constraints[0]) +
            ')'
          : ''
      }`;

      if (!propNameToValidationsMap[validationMetadata.propertyName]) {
        propNameToValidationsMap[validationMetadata.propertyName] = [validationExpr];
      }

      if (!propNameToValidationsMap[validationMetadata.propertyName].includes(validationExpr))
        propNameToValidationsMap[validationMetadata.propertyName].push(validationExpr);
    }
  });

  return Object.entries(propNameToValidationsMap).reduce(
    (accumulatedValidationMetadata, [propName, validations]) => {
      return {
        ...accumulatedValidationMetadata,
        [propName]: validations
      };
    },
    {}
  );
}

export type FunctionMetadata = {
  functionName: string;
  argType: string;
  returnValueType: string;
};

export type ServiceMetadata = {
  serviceName: string;
  functions: FunctionMetadata[];
  types: { [p: string]: object };
  validations: { [p: string]: any[] };
};

export default function generateServicesMetadata<T>(controller: T): ServiceMetadata[] {
  return Object.entries(controller)
    .filter(
      ([, propValue]: [string, any]) => typeof propValue === 'object' && propValue.constructor !== Object
    )
    .map(([serviceName]: [string, any]) => {
      const servicePrototype = Object.getPrototypeOf((controller as any)[serviceName]);

      const functionNames = Object.getOwnPropertyNames(servicePrototype).filter(
        (ownPropertyName: string) => ownPropertyName !== 'constructor'
      );

      const functions: FunctionMetadata[] = functionNames.map((functionName: string) => {
        const paramTypeName = (controller as any)[`${serviceName}Types`].functionNameToParamTypeNameMap[
          functionName
        ];

        const returnValueTypeName: string = (controller as any)[`${serviceName}Types`]
          .functionNameToReturnTypeNameMap[functionName];

        if (paramTypeName !== undefined && !(controller as any)[serviceName].Types[paramTypeName]) {
          throw new Error('Type: ' + paramTypeName + ' is not declared in Types of ' + serviceName);
        }

        let finalReturnValueTypeName = returnValueTypeName.split('|')[0].trim();
        if (finalReturnValueTypeName.endsWith('[]')) {
          finalReturnValueTypeName = finalReturnValueTypeName.slice(0, -2);
        }

        if (finalReturnValueTypeName.startsWith('Partial<')) {
          finalReturnValueTypeName = finalReturnValueTypeName.slice(8, -1);
        }

        if (
          finalReturnValueTypeName !== 'void' &&
          !(controller as any)[serviceName].Types[finalReturnValueTypeName]
        ) {
          throw new Error(
            'Type: ' + finalReturnValueTypeName + ' is not declared in Types of ' + serviceName
          );
        }

        return {
          functionName,
          argType: paramTypeName,
          returnValueType: returnValueTypeName
        };
      });

      const typeMetadatas = Object.entries((controller as any)[serviceName].Types).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const typeObject = getTypeMetadata(typeClass);
          return { ...accumulatedTypes, [typeName]: typeObject };
        },
        {}
      );

      const validationMetadatas = Object.entries((controller as any)[serviceName].Types).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const validationMetadata = getValidationMetadata(typeClass);
          if (Object.keys(validationMetadata).length > 0) {
            return { ...accumulatedTypes, [typeName]: validationMetadata };
          }
          return accumulatedTypes;
        },
        {}
      );

      return {
        serviceName,
        functions,
        types: {
          ...typeMetadatas,
          ErrorResponse: {
            statusCode: 'integer',
            message: 'string'
          }
        },
        validations: validationMetadatas
      };
    });
}
