import parseEnumValuesFromSrcFile from "../../../../../typescript/parser/parseEnumValuesFromSrcFile";
import getSrcFilePathNameForTypeName from "../../../../../utils/file/getSrcFilePathNameForTypeName";

export default function getEnumSqlColumnType(baseFieldTypeName: string) {
  let enumValues;
  if (baseFieldTypeName[0] === '(') {
   enumValues = baseFieldTypeName.slice(1).split(/[|)]/);
  } else {
    enumValues = parseEnumValuesFromSrcFile(getSrcFilePathNameForTypeName(baseFieldTypeName));
  }

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
