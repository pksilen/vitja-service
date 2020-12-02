import entityContainer from '../../../../../decorators/entity/entityAnnotationContainer';
import getPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import shouldIncludeField from '../utils/columns/shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../utils/type/isEntityTypeName';
import entityAnnotationContainer from '../../../../../decorators/entity/entityAnnotationContainer';

export default function getJoinClause(
  schema: string,
  projection: Projection,
  entityClass: Function,
  Types: object
) {
  let joinClause = '';

  if (entityContainer.entityNameToJoinsMap[entityClass.name]) {
    const joinClauseParts = entityContainer.entityNameToJoinsMap[entityClass.name].map((joinSpec) => {
      if (!shouldIncludeField('id', schema + joinSpec.subEntityTableName, projection)) {
        return '';
      }

      let joinClausePart = 'LEFT JOIN ';
      joinClausePart += schema + '.' + joinSpec.subEntityTableName;
      joinClausePart += ' ON ';
      joinClausePart +=
        schema +
        '.' +
        entityClass.name +
        '.' +
        joinSpec.entityIdFieldName +
        ' = ' +
        schema +
        '.' +
        joinSpec.subEntityTableName +
        '.' +
        joinSpec.subEntityForeignIdFieldName;

      return joinClausePart;
    });

    joinClause = joinClauseParts.filter((joinClausePart) => joinClausePart).join(' ');
  }

  const joinClauseParts = entityAnnotationContainer.manyToManyRelationTableSpecs
    .filter(({ associationTableName }) => associationTableName.startsWith(entityClass.name))
    .map(({ associationTableName, entityForeignIdFieldName, subEntityForeignIdFieldName }) => {
      const subEntityTableName = associationTableName.split('_')[1];
      let joinClausePart = 'LEFT JOIN ';
      joinClausePart += schema + '.' + associationTableName;
      joinClausePart += ' ON ';
      joinClausePart +=
        schema +
        '.' +
        entityClass.name + '._id' +
        ' = ' +
        schema +
        '.' +
        associationTableName +
        '.' +
        entityForeignIdFieldName + ' LEFT JOIN ' +
        schema + '.' + subEntityTableName + ' ON ' +
        schema + '.' + associationTableName + '.' + subEntityForeignIdFieldName + ' = ' +
        schema + '.' + subEntityTableName + '_id'
        ;

      return joinClausePart;
    });

  joinClause = joinClause + ' ' + joinClauseParts.join(' ');

  const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);

  Object.entries(entityMetadata).forEach(([, fieldTypeName]: [any, any]) => {
    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      joinClause += getJoinClause(schema, projection, (Types as any)[baseTypeName], Types);
    }
  });

  return joinClause;
}
