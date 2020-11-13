import getTypeMetadata from "../../../../../metadata/getTypeMetadata";

function transformResult(result: any, entityClass: Function, Types: object) {
  const entityMetadata = getTypeMetadata(entityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
    let baseFieldTypeName = fieldTypeName;
    let isArray = false;

    if (fieldTypeName.endsWith('[]')) {
      baseFieldTypeName = fieldTypeName.slice(0, -2);
      isArray = true;
    }

    if ( baseFieldTypeName !== 'Date' && baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
      transformResult(result[fieldName], (Types as any)[baseFieldTypeName], Types);
    } else if (isArray && result[fieldName]) {
      const singularFieldName = fieldName.slice(0, -1);
      result[fieldName] = result[fieldName].map((obj: any) => obj[singularFieldName]);
    }
  });
}

export default function transformResults(results: object[], entityClass: Function, Types: object) {
  results.forEach((result) => transformResult(result, entityClass, Types));
}
