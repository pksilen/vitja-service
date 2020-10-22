import { OptionalProjection } from "../../../../types/OptionalProjection";

export default function shouldIncludeField(
  fieldName: string,
  fieldPath: string,
  { includeResponseFields, excludeResponseFields }: OptionalProjection
) {
  let shouldIncludeField = true;
  const fullFieldPath = fieldPath + fieldName;

  if (includeResponseFields && includeResponseFields.length > 0) {
    shouldIncludeField = !!includeResponseFields.find((includeResponseField) =>
      fullFieldPath.length >= includeResponseField.length && fullFieldPath.includes('.')
        ? includeResponseField === fullFieldPath.slice(0, includeResponseField.length)
        : includeResponseField === fullFieldPath
    );
  }

  if (excludeResponseFields && excludeResponseFields.length > 0) {
    const shouldExcludeField = !!excludeResponseFields.find(
      (excludeResponseField) => excludeResponseField === fullFieldPath.slice(0, excludeResponseField.length)
    );

    shouldIncludeField = shouldExcludeField ? false : shouldIncludeField;
  }

  return shouldIncludeField;
}
