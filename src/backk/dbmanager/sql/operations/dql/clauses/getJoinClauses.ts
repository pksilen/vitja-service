import entityAnnotationContainer from '../../../../../decorators/entity/entityAnnotationContainer';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import { Projection } from '../../../../../types/postqueryoperations/Projection';
import shouldIncludeField from '../utils/columns/shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../utils/type/isEntityTypeName';
import tryGetWhereClause from './tryGetWhereClause';
import tryGetSortClause from './tryGetOrderByClause';
import getPaginationClause from './getPaginationClause';
import SqlExpression from '../../../expressions/SqlExpression';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import Pagination from '../../../../../types/postqueryoperations/Pagination';
import getSingularName from '../../../../../utils/getSingularName';

// noinspection OverlyComplexFunctionJS
export default function getJoinClauses(
  dbManager: AbstractSqlDbManager,
  subEntityPath: string,
  projection: Projection,
  filters: SqlExpression[] | UserDefinedFilter[] | undefined,
  sortBys: SortBy[],
  paginations: Pagination[],
  EntityClass: new () => any,
  Types: object,
  resultOuterSortBys: string[]
) {
  let joinClauses = '';

  if (entityAnnotationContainer.entityNameToJoinsMap[EntityClass.name]) {
    const joinClauseParts = entityAnnotationContainer.entityNameToJoinsMap[EntityClass.name].map(
      (joinSpec) => {
        const joinEntityPath = subEntityPath
          ? subEntityPath + '.' + joinSpec.entityFieldName
          : joinSpec.entityFieldName;

        if (!shouldIncludeField('id', joinEntityPath, projection)) {
          return '';
        }

        let logicalSubEntityTableName = joinSpec.subEntityTableName;
        let physicalSubEntityTableName = logicalSubEntityTableName;

        if (entityAnnotationContainer.entityNameToTableNameMap[logicalSubEntityTableName]) {
          physicalSubEntityTableName =
            entityAnnotationContainer.entityNameToTableNameMap[logicalSubEntityTableName];
        }

        // noinspection ReuseOfLocalVariableJS
        logicalSubEntityTableName = getSingularName(joinSpec.entityFieldName);

        const whereClause = tryGetWhereClause(dbManager, joinEntityPath, filters);
        const sortClause = tryGetSortClause(dbManager, joinEntityPath, sortBys, EntityClass, Types);
        const joinTableAlias = dbManager.schema + '_' + logicalSubEntityTableName;

        const outerSortBys = tryGetSortClause(
          dbManager,
          joinEntityPath,
          sortBys,
          EntityClass,
          Types,
          joinTableAlias
        );

        if (outerSortBys) {
          resultOuterSortBys.push(outerSortBys);
        }

        const paginationClause = getPaginationClause(joinEntityPath, paginations);
        const whereClausePart =
          joinSpec.subEntityForeignIdFieldName.toLowerCase() +
          ' = ' +
          dbManager.schema +
          '_' +
          EntityClass.name.toLowerCase() +
          '.' +
          joinSpec.entityIdFieldName.toLowerCase();

        let joinClausePart = 'LEFT JOIN LATERAL (SELECT * FROM ';
        joinClausePart += dbManager.schema + '.' + physicalSubEntityTableName.toLowerCase();

        joinClausePart +=
          (whereClause ? ' ' + whereClause + ' AND ' + whereClausePart : ' WHERE ' + whereClausePart) +
          (sortClause ? ' ' + sortClause : '') +
          (paginationClause ? ' ' + paginationClause : '') +
          ') AS ' +
          dbManager.schema +
          '_' +
          logicalSubEntityTableName.toLowerCase();

        joinClausePart += ' ON ';

        joinClausePart +=
          dbManager.schema +
          '_' +
          EntityClass.name.toLowerCase() +
          '.' +
          joinSpec.entityIdFieldName.toLowerCase() +
          ' = ' +
          dbManager.schema +
          '_' +
          logicalSubEntityTableName.toLowerCase() +
          '.' +
          joinSpec.subEntityForeignIdFieldName.toLowerCase();

        return joinClausePart;
      }
    );

    joinClauses = joinClauseParts.filter((joinClausePart) => joinClausePart).join(' ');
  }

  const joinClauseParts = entityAnnotationContainer.manyToManyRelationTableSpecs
    .filter(({ associationTableName }) => associationTableName.startsWith(EntityClass.name + '_'))
    .map(
      ({
        entityFieldName,
        associationTableName,
        entityForeignIdFieldName,
        subEntityName,
        subEntityForeignIdFieldName
      }) => {
        const joinEntityPath = subEntityPath ? subEntityPath + '.' + entityFieldName : entityFieldName;
        let logicalSubEntityTableName = subEntityName;
        let physicalSubEntityTableName = logicalSubEntityTableName;

        if (entityAnnotationContainer.entityNameToTableNameMap[logicalSubEntityTableName]) {
          physicalSubEntityTableName =
            entityAnnotationContainer.entityNameToTableNameMap[logicalSubEntityTableName];
        }

        // noinspection ReuseOfLocalVariableJS
        logicalSubEntityTableName = associationTableName.split('_')[1];

        if (
          !shouldIncludeField(
            '_id',
            subEntityPath ? subEntityPath + '.' + entityFieldName : entityFieldName,
            projection
          )
        ) {
          return '';
        }

        const whereClause = tryGetWhereClause(dbManager, joinEntityPath, filters);
        const joinTableAlias = dbManager.schema + '_' + logicalSubEntityTableName.toLowerCase();
        const outerSortBys = tryGetSortClause(
          dbManager,
          joinEntityPath,
          sortBys,
          EntityClass,
          Types,
          joinTableAlias
        );

        if (outerSortBys) {
          resultOuterSortBys.push(outerSortBys);
        }

        const sortClause = tryGetSortClause(dbManager, joinEntityPath, sortBys, EntityClass, Types);
        const paginationClause = getPaginationClause(joinEntityPath, paginations);
        const whereClausePart =
          '_id = ' +
          dbManager.schema +
          '.' +
          associationTableName.toLowerCase() +
          '.' +
          subEntityForeignIdFieldName.toLowerCase();

        let joinClausePart = 'LEFT JOIN ';
        joinClausePart += dbManager.schema + '.' + associationTableName.toLowerCase();
        joinClausePart += ' ON ';
        joinClausePart +=
          dbManager.schema +
          '_' +
          EntityClass.name.toLowerCase() +
          '._id' +
          ' = ' +
          dbManager.schema +
          '.' +
          associationTableName.toLowerCase() +
          '.' +
          entityForeignIdFieldName.toLowerCase() +
          ' LEFT JOIN LATERAL (SELECT * FROM ' +
          dbManager.schema +
          '.' +
          physicalSubEntityTableName.toLowerCase() +
          (whereClause ? ' ' + whereClause + ' AND ' + whereClausePart : ' WHERE ' + whereClausePart) +
          (sortClause ? ' ' + sortClause : '') +
          (paginationClause ? ' ' + paginationClause : '') +
          ') AS ' +
          dbManager.schema +
          '_' +
          logicalSubEntityTableName.toLowerCase() +
          ' ON ' +
          dbManager.schema +
          '.' +
          associationTableName.toLowerCase() +
          '.' +
          subEntityForeignIdFieldName.toLowerCase() +
          ' = ' +
          dbManager.schema +
          '_' +
          logicalSubEntityTableName.toLowerCase() +
          '._id';

        return joinClausePart;
      }
    );

  if (joinClauseParts.length > 0) {
    joinClauses = joinClauses + ' ' + joinClauseParts.join(' ');
  }

  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);

    if (isEntityTypeName(baseTypeName)) {
      const newSubEntityPath = subEntityPath ? subEntityPath + '.' + fieldName : fieldName;

      const subJoinClauses = getJoinClauses(
        dbManager,
        newSubEntityPath,
        projection,
        filters,
        sortBys,
        paginations,
        (Types as any)[baseTypeName],
        Types,
        resultOuterSortBys
      );

      if (subJoinClauses) {
        joinClauses += ' ' + subJoinClauses;
      }
    }
  });

  return joinClauses;
}
