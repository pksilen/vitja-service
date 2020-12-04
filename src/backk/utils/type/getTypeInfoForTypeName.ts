export default function getTypeInfoForTypeName(typeName: string) {
  let canBeErrorResponse = false;
  if (typeName.endsWith(' | ErrorResponse')) {
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.split(' | ErrorResponse')[0];
    canBeErrorResponse = true;
  }

  const isOptionalType = typeName.startsWith('?');
  // noinspection AssignmentToFunctionParameterJS
  typeName = isOptionalType ? typeName.slice(1) : typeName;
  if (typeName.startsWith('(') && typeName.endsWith(')') && typeName.includes(' | null')) {
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.slice(1, -1);
  }

  let defaultValueStr;
  [typeName, defaultValueStr] = typeName.split(' = ');

  let isArrayType = false;
  if (typeName.endsWith('[]')) {
    isArrayType = true;
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.slice(0, -2);
  } else if (typeName.startsWith('Array<')) {
    isArrayType = true;
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.slice(6, -1);
  }

  if (isArrayType && typeName.startsWith('(') && typeName.endsWith(')')) {
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.slice(1, -1);
  }

  let isNullableType = false;
  if (typeName.endsWith(' | null')) {
    isNullableType = true;
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.split(' | null')[0];
  }

  if (typeName.endsWith('[]') || typeName.startsWith('Array<')) {
    if (isNullableType) {
      throw new Error(
        'Array type union with null type is not allowed, use empty array to denote a missing value.'
      );
    } else if (isArrayType) {
      throw new Error('Multi-dimensional types not allowed');
    }
  }

  return {
    baseTypeName: typeName,
    canBeErrorResponse,
    defaultValueStr,
    isArrayType,
    isNullableType,
    isOptionalType
  };
}
