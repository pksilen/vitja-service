import entityContainer from '../../../../annotations/entity/entityAnnotationContainer';
import { getTypeMetadata } from '../../../../generateServicesMetadata';

export default function getJoinStatement(schema: string, entityClass: Function, Types: object) {
  let joinStatement = '';

  if (entityContainer.entityNameToJoinsMap[entityClass.name]) {
    entityContainer.entityNameToJoinsMap[entityClass.name].forEach((joinSpec, index) => {
      if (index !== 0) {
        joinStatement += ' ';
      }

      joinStatement += 'LEFT JOIN ';
      joinStatement += schema + '.' + joinSpec.joinTableName;
      joinStatement += ' ON ';
      joinStatement +=
        schema +
        '.' +
        entityClass.name +
        '.' +
        joinSpec.fieldName +
        ' = ' +
        schema +
        '.' +
        joinSpec.joinTableName +
        '.' +
        joinSpec.joinTableFieldName;
    });
  }

  const entityMetadata = getTypeMetadata(entityClass as any);

  Object.entries(entityMetadata).forEach(([, fieldTypeName]: [any, any]) => {
    let baseFieldTypeName = fieldTypeName;

    if (fieldTypeName.endsWith('[]')) {
      baseFieldTypeName = fieldTypeName.slice(0, -2);
    }

    if (baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
      joinStatement += getJoinStatement(schema, (Types as any)[baseFieldTypeName], Types);
    }
  });

  return joinStatement;
}
