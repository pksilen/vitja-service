import { getFromContainer, MetadataStorage } from "class-validator";
import { ValidationMetadata } from "class-validator/metadata/ValidationMetadata";

export default function getValidationConstraint(typeClass: Function, propertyName: string, validationType: string): any {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  const foundValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === validationType
  );

  return foundValidation ? foundValidation.constraints[0] : undefined;
}
