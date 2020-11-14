import entityContainer from '../../../../../decorators/entity/entityAnnotationContainer';
import getPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import shouldIncludeField from '../utils/columns/shouldIncludeField';

export default function getJoinClause(
  schema: string,
  projection: Projection,
  entityClass: Function,
  Types: object
) {
  let joinClause = '';

  if (entityContainer.entityNameToJoinsMap[entityClass.name]) {
    const joinClauseParts = entityContainer.entityNameToJoinsMap[entityClass.name].map((joinSpec) => {
      if (!shouldIncludeField('id', schema + joinSpec.joinTableName, projection)) {
        return '';
      }

      let joinClausePart = 'LEFT JOIN ';
      joinClausePart += schema + '.' + joinSpec.joinTableName;
      joinClausePart += ' ON ';
      joinClausePart +=
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

      return joinClausePart;
    });

    joinClause = joinClauseParts.filter((joinClausePart) => joinClausePart).join(' ');
  }

  const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);

  Object.entries(entityMetadata).forEach(([, fieldTypeName]: [any, any]) => {
    let baseFieldTypeName = fieldTypeName;

    if (fieldTypeName.endsWith('[]')) {
      baseFieldTypeName = fieldTypeName.slice(0, -2);
    }

    if ( baseFieldTypeName !== 'Date' && baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
      joinClause += getJoinClause(schema, projection, (Types as any)[baseFieldTypeName], Types);
    }
  });

  return joinClause;
}
