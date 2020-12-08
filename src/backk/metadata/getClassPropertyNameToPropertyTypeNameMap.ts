import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

const classNameToMetadataMap: { [key: string]: { [key: string]: string } } = {};

export default function getClassPropertyNameToPropertyTypeNameMap<T>(
  Class: new () => T,
  isGeneration = false,
  isResponseValueType: boolean | undefined = undefined
): { [key: string]: string } {
  if (!isGeneration && classNameToMetadataMap[Class.name]) {
    return classNameToMetadataMap[Class.name];
  }

  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(Class, '');
  const prototypes = [];
  let prototype = Object.getPrototypeOf(new Class());
  while (prototype !== Object.prototype) {
    prototypes.push(prototype);
    prototype = Object.getPrototypeOf(prototype);
  }
  prototypes.reverse();
  prototypes.forEach((prototype) => {
    validationMetadatas.sort(({ target }) => (target === prototype.constructor ? -1 : 0));
  });
  validationMetadatas.reverse();

  const propNameToIsOptionalMap: { [key: string]: boolean } = {};
  const propNameToPropTypeNameMap: { [key: string]: string } = {};
  const propNameToDefaultValueMap: { [key: string]: any } = {};

  const typeObject = new Class();
  Object.entries(typeObject).forEach(([propName, defaultValue]: [string, any]) => {
    propNameToDefaultValueMap[propName] = defaultValue;
  });

  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    if (isResponseValueType && validationMetadata.propertyName === 'errorMessage') {
      throw new Error(Class.name + ' may not contain property errorMessage');
    }

    if (
      validationMetadata.type === 'maxLength' ||
      validationMetadata.type === 'conditionalValidation' ||
      validationMetadata.type === 'nestedValidation'
    ) {
      if (!validationMetadata.groups?.includes('__backk_firstRound__')) {
        validationMetadata.groups = validationMetadata.groups?.concat('__backk_firstRound__') ?? [
          '__backk_firstRound__'
        ];
      }
    }

    if (
      validationMetadata.type !== 'arrayMaxSize' &&
      validationMetadata.type !== 'arrayUnique' &&
      (validationMetadata.type !== 'customValidation' ||
        (validationMetadata.type === 'customValidation' &&
          validationMetadata.constraints[0] !== 'isUndefined'))
    ) {
      if (!validationMetadata.groups?.includes('__backk_response__')) {
        validationMetadata.groups = validationMetadata.groups?.concat('__backk_response__') ?? [
          '__backk_response__'
        ];
      }
    }

    if (
      validationMetadata.type !== 'customValidation' ||
      (validationMetadata.type === 'customValidation' && validationMetadata.constraints[0] !== 'isUndefined')
    ) {
      const undefinedValidation = validationMetadatas.find(
        ({ propertyName, type, constraints }: ValidationMetadata) =>
          propertyName === validationMetadata.propertyName &&
          type === 'customValidation' &&
          constraints?.[0] === 'isUndefined'
      );

      if (undefinedValidation?.groups?.[0] === '__backk_create__' && !undefinedValidation.groups?.[1]) {
        if (!validationMetadata.groups?.includes('__backk_update__')) {
          validationMetadata.groups = validationMetadata.groups?.concat('__backk_update__') ?? [
            '__backk_update__'
          ];
        }
      } else if (
        undefinedValidation?.groups?.[0] === '__backk_create__' &&
        undefinedValidation?.groups?.[1] === '__backk_update__'
      ) {
        if (!validationMetadata.groups?.includes('__backk_none__')) {
          validationMetadata.groups = validationMetadata.groups?.concat('__backk_none__') ?? [
            '__backk_none__'
          ];
        }
      } else {
        if (
          !validationMetadata.groups?.includes('__backk_none__') &&
          !validationMetadata.groups?.includes('__backk_argument__') &&
          !validationMetadata.groups?.includes('__backk_update__')
        ) {
          validationMetadata.groups = validationMetadata.groups?.concat('__backk_argument__') ?? [
            '__backk_argument__'
          ];
        }
      }
    }

    let isNullable = false;
    if (validationMetadata.type === 'conditionalValidation') {
      if (
        validationMetadata.constraints[1] === 'isOptional' &&
        validationMetadata.groups[0] !== '__backk_update__'
      ) {
        propNameToIsOptionalMap[validationMetadata.propertyName] = true;
      } else if (validationMetadata.constraints[1] === 'isNullable') {
        isNullable = true;
      }
    }

    switch (validationMetadata.type) {
      case 'isBoolean':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          'boolean' + (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'isNumber':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          'number' + (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'isString':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          'string' + (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'isInt':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          'integer' + (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'isDate':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          'Date' + (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'customValidation':
        if (validationMetadata.constraints[0] === 'isBigInt') {
          propNameToPropTypeNameMap[validationMetadata.propertyName] =
            'bigint' + (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        }
        break;
      case 'isIn':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          '(' +
          validationMetadata.constraints[0]
            .map((value: any) => (typeof value === 'string' ? `'${value}'` : `${value}`))
            .join('|') +
          ')' +
          (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'isInstance':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          validationMetadata.constraints[0].name +
          (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '');
        break;
      case 'isArray':
        propNameToPropTypeNameMap[validationMetadata.propertyName] =
          (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '') + '[]';
        break;
    }

    if (isNullable) {
      propNameToPropTypeNameMap[validationMetadata.propertyName] =
        (propNameToPropTypeNameMap[validationMetadata.propertyName] ?? '') + ' | null';
    }

    const hasMatchesValidation = !!validationMetadatas.find(
      ({ propertyName, type }: ValidationMetadata) =>
        propertyName === validationMetadata.propertyName && type === 'matches'
    );

    if (isGeneration && hasMatchesValidation) {
      throw new Error(
        'Property ' +
          Class.name +
          '.' +
          validationMetadata.propertyName +
          ': Use @MaxLengthAndMatches or @MaxLengthAndMatchesAll instead of @Matches'
      );
    }

    if (validationMetadata.type === 'isArray') {
      const arrayMaxSizeValidationMetadata = validationMetadatas.find(
        (otherValidationMetadata: ValidationMetadata) =>
          otherValidationMetadata.propertyName === validationMetadata.propertyName &&
          otherValidationMetadata.type === 'arrayMaxSize'
      );

      if (!arrayMaxSizeValidationMetadata) {
        throw new Error(
          'Property ' +
            Class.name +
            '.' +
            validationMetadata.propertyName +
            ' has array type and must have @ArrayMaxSize annotation'
        );
      }
    }

    if (isGeneration) {
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
              Class.name +
              '.' +
              validationMetadata.propertyName +
              ' has numeric type and must have @Min and @Max annotations'
          );
        }

        if (minValidationMetadata.constraints[0] > maxValidationMetadata.constraints[0]) {
          throw new Error(
            'Property ' +
              Class.name +
              '.' +
              validationMetadata.propertyName +
              ' has @Min validation that is greater than @Max validation'
          );
        }

        if (validationMetadata.type === 'isInt' && minValidationMetadata.constraints[0] < -2147483648) {
          throw new Error(
            'Property ' +
              Class.name +
              '.' +
              validationMetadata.propertyName +
              ' has @Min validation value must be equal or greater than -2147483648'
          );
        }

        if (validationMetadata.type === 'isInt' && maxValidationMetadata.constraints[0] > 2147483647) {
          throw new Error(
            'Property ' +
              Class.name +
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
              Class.name +
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
              Class.name +
              '.' +
              validationMetadata.propertyName +
              ' @Max validation value must be equal or less than ' +
              Number.MAX_SAFE_INTEGER
          );
        }

        if (validationMetadata.type === 'isNumber' && minValidationMetadata.constraints[0] < -(10 ** 308)) {
          throw new Error(
            'Property ' +
              Class.name +
              '.' +
              validationMetadata.propertyName +
              ' @Min validation value must be equal or greater than -1E308'
          );
        }

        if (validationMetadata.type === 'isNumber' && maxValidationMetadata.constraints[0] > 10 ** 308) {
          throw new Error(
            'Property ' +
              Class.name +
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

        const hasLengthValidation = !!validationMetadatas.find(
          ({ type, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && type === 'length'
        );

        const hasMaxLengthAndMatchesValidation = !!validationMetadatas.find(
          ({ constraints, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && constraints?.[0] === 'maxLengthAndMatches'
        );

        const hasMaxLengthAndMatchesAllValidation = !!validationMetadatas.find(
          ({ constraints, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && constraints?.[0] === 'maxLengthAndMatchesAll'
        );

        const hasLengthAndMatchesValidation = !!validationMetadatas.find(
          ({ constraints, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && constraints?.[0] === 'lengthAndMatches'
        );

        const hasLengthAndMatchesAllValidation = !!validationMetadatas.find(
          ({ constraints, propertyName }: ValidationMetadata) =>
            propertyName === validationMetadata.propertyName && constraints?.[0] === 'lengthAndMatchesAll'
        );

        if (
          !hasMaxLengthValidation &&
          !hasMaxLengthAndMatchesValidation &&
          !hasMaxLengthAndMatchesAllValidation &&
          !hasLengthValidation &&
          !hasLengthAndMatchesValidation &&
          !hasLengthAndMatchesAllValidation
        ) {
          throw new Error(
            'Property ' +
              Class.name +
              '.' +
              validationMetadata.propertyName +
              ' has string type and must have either @Length, @MaxLength, @MaxLengthAndMatches or @MaxLengthAndMatchesAll annotation'
          );
        }
      }
    }
  });

  const metadata = Object.entries(propNameToPropTypeNameMap).reduce(
    (accumulatedTypeObject, [propName, propTypeName]) => {
      let finalPropType = propTypeName;
      if (propNameToIsOptionalMap[propName] && propTypeName.includes(' | null') && propTypeName[0] !== '(') {
        finalPropType = '(' + propTypeName + ')';
      }
      return {
        ...accumulatedTypeObject,
        [propName]:
          (propNameToIsOptionalMap[propName] ? '?' + finalPropType : finalPropType) +
          (propNameToDefaultValueMap[propName] === undefined
            ? ''
            : ` = ${JSON.stringify(propNameToDefaultValueMap[propName])}`)
      };
    },
    {}
  );

  if (!classNameToMetadataMap[Class.name]) {
    classNameToMetadataMap[Class.name] = metadata;
  }

  return metadata;
}
