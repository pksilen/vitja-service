import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

function getTypeObject<T>(typeClass: new () => T): object {
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
        (propNameToDefaultValueMap[propName] !== undefined
          ? ` = ${JSON.stringify(propNameToDefaultValueMap[propName])}`
          : '')
    };
  }, {});
}

export default function generateMetadata<T>(controller: T): object {
  return Object.entries(controller)
    .filter(
      ([, propValue]: [string, any]) => typeof propValue === 'object' && propValue.constructor !== Object
    )
    .map(([serviceName]: [string, any]) => {
      const servicePrototype = Object.getPrototypeOf((controller as any)[serviceName]);

      const functionNames = Object.getOwnPropertyNames(servicePrototype).filter(
        (ownPropertyName: string) => ownPropertyName !== 'constructor'
      );

      const functions = functionNames.map((functionName: string) => {
        const paramTypeName = (controller as any)[`${serviceName}Types`].functionNameToParamTypeNameMap[
          functionName
        ];

        const returnValueTypeName = (controller as any)[`${serviceName}Types`]
          .functionNameToReturnTypeNameMap[functionName];

        return {
          functionName,
          argType: paramTypeName,
          returnValueType: returnValueTypeName
        };
      });

      const types = Object.entries((controller as any)[serviceName].Types).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const typeObject = getTypeObject(typeClass);
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
