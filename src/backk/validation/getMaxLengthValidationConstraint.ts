import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

export default function getMaxLengthValidationConstraint(Class: Function, propertyName: string) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(Class, '');

  const maxLengthValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === 'maxLength'
  );

  if (maxLengthValidation) {
    return maxLengthValidation.constraints[0];
  }

  const lengthValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === 'length'
  );

  if (lengthValidation) {
    return lengthValidation.constraints[1];
  }

  const lengthAndMatchesValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName &&
      validationMetadata.type === 'customValidation' &&
      validationMetadata.constraints[0] === 'lengthAndMatches'
  );

  if (lengthAndMatchesValidation) {
    return lengthAndMatchesValidation.constraints[2];
  }

  const lengthAndMatchesAllValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName &&
      validationMetadata.type === 'customValidation' &&
      validationMetadata.constraints[0] === 'lengthAndMatchesAll'
  );

  if (lengthAndMatchesAllValidation) {
    return lengthAndMatchesAllValidation.constraints[2];
  }

  const maxLengthAndMatchesValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName &&
      validationMetadata.type === 'customValidation' &&
      validationMetadata.constraints[0] === 'maxLengthAndMatches'
  );

  if (maxLengthAndMatchesValidation) {
    return maxLengthAndMatchesValidation.constraints[1];
  }

  const maxLengthAndMatchesAllValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName &&
      validationMetadata.type === 'customValidation' &&
      validationMetadata.constraints[0] === 'maxLengthAndMatchesAll'
  );

  if (maxLengthAndMatchesAllValidation) {
    return maxLengthAndMatchesAllValidation.constraints[1];
  }

  throw new Error("Cannot figure out string property's maximum length");
}
