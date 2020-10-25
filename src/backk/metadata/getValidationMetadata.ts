import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

export default function getValidationMetadata<T>(typeClass: new () => T): object {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');
  const propNameToValidationsMap: { [key: string]: string[] } = {};

  // noinspection FunctionWithMoreThanThreeNegationsJS
  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    if (
      validationMetadata.type !== 'conditionalValidation' &&
      validationMetadata.type !== 'nestedValidation' &&
      validationMetadata.type !== 'isInstance'
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
