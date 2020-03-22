import { getFromContainer, MetadataStorage, ValidationTypes } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';

function setDecorators(
  typeClass: Function,
  targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean }
) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    switch (validationMetadata.type) {
      case 'isInstance':
        const nestedValidationMetadataArgs: ValidationMetadataArgs = {
          type: ValidationTypes.NESTED_VALIDATION,
          target: validationMetadata.target,
          propertyName: validationMetadata.propertyName,
          validationOptions: { each: validationMetadata.each }
        };

        if (
          !targetAndPropNameToHasNestedValidationMap[
            (validationMetadata.target as Function).name + validationMetadata.propertyName
          ]
        ) {
          Type(() => validationMetadata.constraints[0])(
            new (validationMetadata.target as new () => any)(),
            validationMetadata.propertyName
          );

          getFromContainer(MetadataStorage).addValidationMetadata(
            new ValidationMetadata(nestedValidationMetadataArgs)
          );

          targetAndPropNameToHasNestedValidationMap[
            (validationMetadata.target as Function).name + validationMetadata.propertyName
          ] = true;
        }
        break;
    }
  });
}

export default function initializeController<T>(controller: T) {
  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object')
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      const types = Object.entries((controller as any)[serviceName].Types).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const typeObject = setDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
          return { ...accumulatedTypes, [typeName]: typeObject };
        },
        {}
      );
    });
}
