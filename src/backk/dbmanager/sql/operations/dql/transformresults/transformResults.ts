import getClassPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../utils/type/isEntityTypeName';

function transformResult(result: any, entityClass: Function, Types: object) {
  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(entityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
    const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      transformResult(result[fieldName], (Types as any)[baseTypeName], Types);
    } else if (isArrayType && result[fieldName]) {
      const singularFieldName = fieldName.slice(0, -1);
      result[fieldName] = result[fieldName].map((obj: any) => obj[singularFieldName]);
    }
  });
}

export default function transformResults(results: object[], entityClass: Function, Types: object) {
  results.forEach((result) => transformResult(result, entityClass, Types));
}
