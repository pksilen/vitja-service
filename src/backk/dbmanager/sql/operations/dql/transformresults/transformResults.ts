import getPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import getTypeInfoFromMetadataType from '../../../../../utils/type/getTypeInfoFromMetadataType';

function transformResult(result: any, entityClass: Function, Types: object) {
  const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
    const { baseTypeName, isArrayType } = getTypeInfoFromMetadataType(fieldTypeName);

    if (
      baseTypeName !== 'Date' &&
      baseTypeName[0] === baseTypeName[0].toUpperCase() &&
      baseTypeName[0] !== '('
    ) {
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
