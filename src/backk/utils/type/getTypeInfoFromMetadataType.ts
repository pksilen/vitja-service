export default function getTypeInfoFromMetadataType(typeStr: string) {
  if (typeStr.endsWith(' | ErrorResponse')) {
    // noinspection AssignmentToFunctionParameterJS
    typeStr = typeStr.split(' | ErrorResponse')[0];
  }
  const isOptionalType = typeStr.startsWith('?');
  const nonOptionalTypeName = isOptionalType ? typeStr.slice(1) : typeStr;
  const [typeName, defaultValueStr] = nonOptionalTypeName.split(' = ');

  let isArrayType = false;
  let nonArrayTypeName = typeName;
  if (typeName.endsWith('[]')) {
    isArrayType = true;
    nonArrayTypeName = typeName.slice(0, -2);
  } else if (typeName.startsWith('Array<')) {
    isArrayType = true;
    nonArrayTypeName = typeName.slice(6, -1);
  }

  let typeNameWithoutParentheses = nonArrayTypeName;
  if (isArrayType && nonArrayTypeName.startsWith('(') && nonArrayTypeName.endsWith(')')) {
    typeNameWithoutParentheses = nonArrayTypeName.slice(1, -1);
  }

  let isNullableType = false;
  let baseTypeName = typeNameWithoutParentheses;
  if (typeNameWithoutParentheses.endsWith(' | null')) {
    isNullableType = true;
    baseTypeName = typeNameWithoutParentheses.split(' | null')[0];
  }

  if (baseTypeName.endsWith('[]') || baseTypeName.startsWith('Array<')) {
    throw new Error('Array type with null type is not allowed, use empty array to denote a missing value.');
  }

  return {
    baseTypeName,
    isNullableType,
    isOptionalType,
    isArrayType,
    defaultValueStr
  };
}
