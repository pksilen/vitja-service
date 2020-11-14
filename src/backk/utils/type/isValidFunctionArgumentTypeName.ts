export default function isValidFunctionArgumentTypeName(typeName: string): boolean {
  return typeName.charAt(0) === typeName.charAt(0).toUpperCase() &&
  !typeName.endsWith('[]') &&
  !typeName.startsWith('Array<') &&
  !typeName.includes('|')
}
