export default function isEntityTypeName(typeName: string): boolean {
  return typeName !== 'Date' &&
    typeName[0] === typeName[0].toUpperCase() &&
    typeName[0] !== '('
}
