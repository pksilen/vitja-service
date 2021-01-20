import SqlExpression from '../../expressions/SqlExpression';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import UserDefinedFilter from '../../../../types/userdefinedfilters/UserDefinedFilter';
import { FilterQuery } from 'mongodb';
import SqlEquals from '../../expressions/SqlEquals';

export default async function getEntitiesByFilters<T>(
  dbManager: AbstractSqlDbManager,
  filters: FilterQuery<T> | SqlExpression[] | UserDefinedFilter[],
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  if (typeof filters === 'object' && !Array.isArray(filters)) {
    // noinspection AssignmentToFunctionParameterJS
    filters = Object.entries(filters).map(([fieldPathName, fieldValue]) => {
      const lastDotPosition = fieldPathName.lastIndexOf('.');
      const fieldName = lastDotPosition === -1 ? fieldPathName : fieldPathName.slice(lastDotPosition + 1);
      const subEntityPath = lastDotPosition === -1 ? '' : fieldPathName.slice(0, lastDotPosition);
      return new SqlEquals(subEntityPath, { [fieldName]: fieldValue });
    });
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const {
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      columns,
      joinClauses,
      filterValues
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, EntityClass, filters);

    const tableName = EntityClass.name.toLowerCase();
    const tableAlias = dbManager.schema + '_' + tableName;

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      `) AS ${tableAlias}`,
      joinClauses
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      postQueryOperations,
      dbManager.getTypes()
    );
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
