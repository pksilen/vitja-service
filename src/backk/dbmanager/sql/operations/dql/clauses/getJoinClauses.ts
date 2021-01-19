import entityContainer from '../../../../../decorators/entity/entityAnnotationContainer';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import shouldIncludeField from '../utils/columns/shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../utils/type/isEntityTypeName';
import entityAnnotationContainer from '../../../../../decorators/entity/entityAnnotationContainer';
import tryGetWhereClause from './tryGetWhereClause';
import tryGetSortClause from './tryGetOrderByClause';
import getPaginationClause from './gePaginationClause';
import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import Pagination from '../../../../../types/postqueryoperations/Pagination';

export default function getJoinClauses(
  dbManager: AbstractSqlDbManager,
  subEntityPath: string,
  projection: Projection,
  filters: SqlExpression[] | UserDefinedFilter[] | undefined,
  sortBys: SortBy[],
  paginations: Pagination[],
  EntityClass: new () => any,
  Types: object
) {
  let joinClauses = '';

  if (entityContainer.entityNameToJoinsMap[EntityClass.name]) {
    const joinClauseParts = entityContainer.entityNameToJoinsMap[EntityClass.name].map((joinSpec) => {
      const joinEntityPath = subEntityPath
        ? subEntityPath + '.' + joinSpec.entityFieldName
        : joinSpec.entityFieldName;

      if (!shouldIncludeField('id', joinEntityPath, projection)) {
        return '';
      }

      const whereClause = tryGetWhereClause(dbManager, joinEntityPath, filters);
      const sortClause = tryGetSortClause(dbManager, joinEntityPath, sortBys, EntityClass, Types);
      const paginationClause = getPaginationClause(joinEntityPath, paginations);

      let joinClausePart = 'LEFT JOIN (SELECT * FROM ';
      joinClausePart += dbManager.schema + '.' + joinSpec.subEntityTableName;
      joinClausePart += ' ON ';
      joinClausePart +=
        EntityClass.name +
        '.' +
        joinSpec.entityIdFieldName +
        ' = ' +
        joinSpec.subEntityTableName +
        '.' +
        joinSpec.subEntityForeignIdFieldName +
        (whereClause ? ' ' + whereClause : '') +
        (sortClause ? ' ' + sortClause : '') +
        (paginationClause ? ' ' + paginationClause : '') +
        ')' +
        ' AS ' +
        joinSpec.subEntityTableName;

      return joinClausePart;
    });

    joinClauses = joinClauseParts.filter((joinClausePart) => joinClausePart).join(' ');
  }

  const joinClauseParts = entityAnnotationContainer.manyToManyRelationTableSpecs
    .filter(({ associationTableName }) => associationTableName.startsWith(EntityClass.name))
    .map(
      ({ entityFieldName, associationTableName, entityForeignIdFieldName, subEntityForeignIdFieldName }) => {
        const joinEntityPath = subEntityPath ? subEntityPath + '.' + entityFieldName : entityFieldName;

        const subEntityTableName = associationTableName.split('_')[1];

        if (!shouldIncludeField('_id', subEntityPath + '.' + subEntityTableName, projection)) {
          return '';
        }

        const whereClause = tryGetWhereClause(dbManager, joinEntityPath, filters);
        const sortClause = tryGetSortClause(dbManager, joinEntityPath, sortBys, EntityClass, Types);
        const paginationClause = getPaginationClause(joinEntityPath, paginations);

        let joinClausePart = 'LEFT JOIN ';
        joinClausePart += dbManager.schema + '.' + associationTableName;
        joinClausePart += ' ON ';
        joinClausePart +=
          EntityClass.name +
          '._id' +
          ' = ' +
          associationTableName +
          '.' +
          entityForeignIdFieldName +
          ' LEFT JOIN (SELECT * FROM ' +
          dbManager.schema +
          '.' +
          subEntityTableName +
          ' ON ' +
          associationTableName +
          '.' +
          subEntityForeignIdFieldName +
          ' = ' +
          subEntityTableName +
          '._id' +
          (whereClause ? ' ' + whereClause : '') +
          (sortClause ? ' ' + sortClause : '') +
          (paginationClause ? ' ' + paginationClause : '') +
          ')' +
          ' AS ' +
          subEntityTableName;

        return joinClausePart;
      }
    );

  joinClauses = joinClauses + ' ' + joinClauseParts.join(' ');

  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      const newSubEntityPath = subEntityPath ? subEntityPath + '.' + fieldName : fieldName;
      joinClauses += getJoinClauses(
        dbManager,
        newSubEntityPath,
        projection,
        filters,
        sortBys,
        paginations,
        (Types as any)[baseTypeName],
        Types
      );
    }
  });

  return joinClauses;
}
