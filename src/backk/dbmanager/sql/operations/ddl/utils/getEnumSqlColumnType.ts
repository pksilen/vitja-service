export default function getEnumSqlColumnType(baseFieldTypeName: string, sqlColumnType: string) {
  const enumValues = baseFieldTypeName.slice(1).split(/[|)]/);
  const firstEnumValue = enumValues[0];
  if (firstEnumValue[0] === "'") {
    return 'VARCHAR';
  } else {
    const hasFloat = enumValues.reduce(
      (hasFloat: boolean, enumValue: string) =>
        hasFloat || parseInt(enumValue, 10).toString().length !== enumValue.length,
      false
    );

    if (hasFloat) {
      return 'DOUBLE PRECISION';
    } else {
      return 'INTEGER';
    }
  }
}
