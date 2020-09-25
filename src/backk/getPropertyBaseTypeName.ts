export default function getPropertyBaseTypeName(propertyTypeName: string): string {
  const isOptionalProperty = propertyTypeName.startsWith('?');
  let basePropertyTypeName = isOptionalProperty ? propertyTypeName.slice(1) : propertyTypeName;
  basePropertyTypeName = basePropertyTypeName.split(' = ')[0];
  basePropertyTypeName = basePropertyTypeName.endsWith('[]')
    ? basePropertyTypeName.slice(0, -2)
    : basePropertyTypeName;

  return basePropertyTypeName
}
