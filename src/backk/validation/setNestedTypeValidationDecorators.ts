/* eslint-disable no-constant-condition */
import { getFromContainer, MetadataStorage, ValidationTypes } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import { Type } from 'class-transformer';

export default function setNestedTypeValidationDecorators(
  Class: Function,
  targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean }
) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(Class, '');

  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    if (validationMetadata.type === 'isDate') {
      if (true
        /*!targetAndPropNameToHasNestedValidationMap[
        (validationMetadata.target as Function).name + validationMetadata.propertyName
          ]*/
      ) {
        Type(() => Date)(
          new (validationMetadata.target as new () => any)(),
          validationMetadata.propertyName
        );

        targetAndPropNameToHasNestedValidationMap[
        (validationMetadata.target as Function).name + validationMetadata.propertyName
          ] = true;
      }
    }

    if (validationMetadata.type === 'isInstance') {
      const nestedValidationMetadataArgs: ValidationMetadataArgs = {
        type: ValidationTypes.NESTED_VALIDATION,
        target: validationMetadata.target,
        propertyName: validationMetadata.propertyName,
        validationOptions: { each: validationMetadata.each }
      };

      if (true
        /*!targetAndPropNameToHasNestedValidationMap[
          (validationMetadata.target as Function).name + validationMetadata.propertyName
        ]*/
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
    }
  });
}
