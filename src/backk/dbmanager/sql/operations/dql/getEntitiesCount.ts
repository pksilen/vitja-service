import SqlExpression from '../../expressions/SqlExpression';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import UserDefinedFilter from '../../../../types/userdefinedfilters/UserDefinedFilter';
import { FilterQuery } from 'mongodb';

export default async function getEntitiesCount<T>(
  dbManager: AbstractSqlDbManager,
  filters: FilterQuery<T> | SqlExpression[] | UserDefinedFilter[] | undefined,
  EntityClass: new () => T
): Promise<number | ErrorResponse> {
  if (filters !== undefined && !Array.isArray(filters)) {
    throw new Error('filters must be SqlExpression array or UserDefinedFilter array');
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const { rootWhereClause, filterValues } = getSqlSelectStatementParts(
      dbManager,
      new DefaultPostQueryOperations(),
      EntityClass,
      filters
    );

    const tableName = EntityClass.name.toLowerCase();
    const result = await dbManager.tryExecuteQueryWithNamedParameters(
      `SELECT COUNT(*) FROM ${dbManager.schema}.${tableName} ${rootWhereClause}`,
      filterValues
    );

    return dbManager.getResultRows(result)[0].count;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
