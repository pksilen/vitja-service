import { getFromContainer, MetadataStorage, ValidationTypes } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import generateMetadata from './generateMetadata';

function setDecorators(
  typeClass: Function,
  targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean }
) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    if (validationMetadata.type === 'isInstance') {
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
    }
  });
}

function writePostmanCollectionExportFile<T>(controller: T) {
  const metadata = generateMetadata(controller);

}

export default function initializeController<T>(controller: T) {
  writePostmanCollectionExportFile(controller);

  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object' && value.constructor !==  Object)
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      Object.entries((controller as any)[serviceName].Types).forEach(([, typeClass]: [string, any]) => {
        setDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
      }, {});
    });
}
