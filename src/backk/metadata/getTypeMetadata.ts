import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

const typeNameToMetadataMap: { [key: string]: { [key: string]: string } } = {};

export default function getTypeMetadata<T>(
  TypeClass: new () => T,
  isGeneration = false,
  isFirstRound = false
): { [key: string]: string } {
  if (!isGeneration && typeNameToMetadataMap[TypeClass.name]) {
    return typeNameToMetadataMap[TypeClass.name];
  }

  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(TypeClass, '');
  const propNameToIsOptionalMap: { [key: string]: boolean } = {};
  const propNameToPropTypeMap: { [key: string]: string } = {};
  const propNameToDefaultValueMap: { [key: string]: any } = {};

  const typeObject = new TypeClass();
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
      case 'customValidation':
        if (validationMetadata.constraints[0] === 'isBigInt') {
          propNameToPropTypeMap[validationMetadata.propertyName] =
            'bigint' + (propNameToPropTypeMap[validationMetadata.propertyName] ?? '');
        }
        break;
      case 'isIn':
        propNameToPropTypeMap[validationMetadata.propertyName] =
          '(' +
          validationMetadata.constraints[0]
            .map((value: any) => (typeof value === 'string' ? `'${value}'` : `${value}`))
            .join('|') +
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

    if (isGeneration && !isFirstRound) {
      if (
        validationMetadata.type === 'isInt' ||
        validationMetadata.type === 'isNumber' ||
        (validationMetadata.type === 'customValidation' && validationMetadata.constraints[0] === 'isBigInt')
      ) {
        const minValidationMetadata = validationMetadatas.find(
          (otherValidationMetadata: ValidationMetadata) =>
            otherValidationMetadata.propertyName === validationMetadata.propertyName &&
            otherValidationMetadata.type === 'min'
        );

        const maxValidationMetadata = validationMetadatas.find(
          (otherValidationMetadata: ValidationMetadata) =>
            otherValidationMetadata.propertyName === validationMetadata.propertyName &&
            otherValidationMetadata.type === 'max'
        );

        if (minValidationMetadata === undefined || maxValidationMetadata === undefined) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' has numeric type and must have @Min and @Max annotations'
          );
        }

        if (minValidationMetadata.constraints[0] > maxValidationMetadata.constraints[0]) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' has @Min validation that is greater than @Max validation'
          );
        }

        if (validationMetadata.type === 'isInt' && minValidationMetadata.constraints[0] < -2147483648) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' has @Min validation value must be equal or greater than -2147483648'
          );
        }

        if (validationMetadata.type === 'isInt' && maxValidationMetadata.constraints[0] > 2147483647) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' @Max validation value must be equal or less than 2147483647'
          );
        }

        if (
          validationMetadata.type === 'customValidation' &&
          validationMetadata.constraints[0] === 'isBigInt' &&
          minValidationMetadata.constraints[0] < Number.MIN_SAFE_INTEGER
        ) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' has @Min validation value must be equal or greater than ' +
              Number.MIN_SAFE_INTEGER.toString()
          );
        }

        if (
          validationMetadata.type === 'customValidation' &&
          validationMetadata.constraints[0] === 'isBigInt' &&
          maxValidationMetadata.constraints[0] > Number.MAX_SAFE_INTEGER
        ) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' @Max validation value must be equal or less than ' +
              Number.MAX_SAFE_INTEGER
          );
        }

        if (validationMetadata.type === 'isNumber' && minValidationMetadata.constraints[0] < -(10 ** 308)) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' @Min validation value must be equal or greater than -1E308'
          );
        }

        if (validationMetadata.type === 'isNumber' && maxValidationMetadata.constraints[0] > 10 ** 308) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' @Max validation value must be equal or less than 1E308'
          );
        }
      }

      if (validationMetadata.type === 'isString') {
        const hasMaxLengthValidation = !!validationMetadatas.find(
          ({ propertyName, type }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && type === 'maxLength'
        );

        const hasMaxLengthAndMatchesValidation = !!validationMetadatas.find(
          ({ constraints, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && constraints?.[0] === 'maxLengthAndMatches'
        );

        const hasMaxLengthAndMatchesAllValidation = !!validationMetadatas.find(
          ({ constraints, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && constraints?.[0] === 'maxLengthAndMatchesAll'
        );

        if (!hasMaxLengthValidation && !hasMaxLengthAndMatchesValidation && !hasMaxLengthAndMatchesAllValidation) {
          throw new Error(
            'Property ' +
              TypeClass.name +
              '.' +
              validationMetadata.propertyName +
              ' has string type and must have either @MaxLength or @MaxLengthAndMatches annotation'
          );
        }
      }
    }
  });

  const metadata = Object.entries(propNameToPropTypeMap).reduce(
    (accumulatedTypeObject, [propName, propType]) => {
      return {
        ...accumulatedTypeObject,
        [propName]:
          (propNameToIsOptionalMap[propName] ? '?' + propType : propType) +
          (propNameToDefaultValueMap[propName] === undefined
            ? ''
            : ` = ${JSON.stringify(propNameToDefaultValueMap[propName])}`)
      };
    },
    {}
  );

  if (!isGeneration) {
    typeNameToMetadataMap[TypeClass.name] = metadata;
  }

  return metadata;
}
