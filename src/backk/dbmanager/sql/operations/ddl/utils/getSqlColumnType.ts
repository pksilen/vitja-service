export default function getSqlColumnType(fieldName: string, baseFieldTypeName: string): string {
  switch (baseFieldTypeName) {
    case 'integer':
      return 'INTEGER';
    case 'bigint':
      return 'BIGINT';
    case 'number':
      return 'DOUBLE PRECISION';
    case 'boolean':
      return 'BOOLEAN';
    case 'string':
      if (fieldName.endsWith('Id') || fieldName === 'id') {
        return 'BIGINT';
      } else {
        return 'VARCHAR';
      }
  }

  return '';
}
