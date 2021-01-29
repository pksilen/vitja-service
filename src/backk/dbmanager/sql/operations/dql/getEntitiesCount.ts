import SqlExpression from '../../expressions/SqlExpression';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import UserDefinedFilter from '../../../../types/userdefinedfilters/UserDefinedFilter';
import MongoDbQuery from '../../../mongodb/MongoDbQuery';
import convertFilterObjectToSqlEquals from './utils/convertFilterObjectToSqlEquals';
import getTableName from '../../../utils/getTableName';

export default async function getEntitiesCount<T>(
  dbManager: AbstractSqlDbManager,
  filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object | undefined,
  EntityClass: new () => T
): Promise<number | ErrorResponse> {
  if (typeof filters === 'object' && !Array.isArray(filters)) {
    // noinspection AssignmentToFunctionParameterJS
    filters = convertFilterObjectToSqlEquals(filters);
  } else if (filters?.find((filter) => filter instanceof MongoDbQuery)) {
    throw new Error('filters must be an array of SqlExpressions and/or UserDefinedFilters');
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const { rootWhereClause, filterValues } = getSqlSelectStatementParts(
      dbManager,
      new DefaultPostQueryOperations(),
      EntityClass,
      filters as SqlExpression[] | UserDefinedFilter[] | undefined
    );

    const tableName = getTableName(EntityClass.name);

    const sqlStatement = [`SELECT COUNT(*) as count FROM ${dbManager.schema}.${tableName}`, rootWhereClause]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(sqlStatement, filterValues);

    return dbManager.getResultRows(result)[0].count;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
