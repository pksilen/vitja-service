import entityContainer from '../../../../../decorators/entity/entityAnnotationContainer';
import getPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import shouldIncludeField from '../utils/columns/shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../utils/type/isEntityTypeName';

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
    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      joinClause += getJoinClause(schema, projection, (Types as any)[baseTypeName], Types);
    }
  });

  return joinClause;
}
