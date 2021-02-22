// noinspection OverlyComplexFunctionJS,FunctionTooLongJS
export default function getTypeInfoForTypeName(typeName: string) {
  let canBeError = false;
  let error = '';

  if (typeName === 'BackError | null' || typeName === 'null | BackError') {
    canBeError = true;
    // noinspection AssignmentToFunctionParameterJS
    typeName = 'void';
  }

  if (typeName.startsWith('[') && typeName.endsWith(']')) {
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeName.slice(1, -1);
    const typeNameParts = typeName.split(',');
    // noinspection AssignmentToFunctionParameterJS
    typeName = typeNameParts[0].trim();
    const errorTypeName = typeNameParts[1]?.trim();

    if (errorTypeName !== 'BackError | null' && errorTypeName === 'null | BackError') {
      error = 'return type must be tuple of successful return value and possible BackError, e.g. [MyEntity, BackkError | null]'
    }

    canBeError = true;
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
    isVoid: typeName === 'void',
    canBeError,
    defaultValueStr,
    isArrayType,
    isNullableType,
    isOptionalType,
    error
  };
}
