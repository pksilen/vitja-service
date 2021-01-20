import SqlExpression from '../../expressions/SqlExpression';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import UserDefinedFilter from '../../../../types/userdefinedfilters/UserDefinedFilter';
import { FilterQuery } from 'mongodb';
import SqlEquals from '../../expressions/SqlEquals';

export default async function getEntitiesCount<T>(
  dbManager: AbstractSqlDbManager,
  filters: FilterQuery<T> | SqlExpression[] | UserDefinedFilter[] | undefined,
  EntityClass: new () => T
): Promise<number | ErrorResponse> {
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
    const { rootWhereClause, filterValues } = getSqlSelectStatementParts(
      dbManager,
      new DefaultPostQueryOperations(),
      EntityClass,
      filters
    );

    const tableName = EntityClass.name.toLowerCase();

    const sqlStatement = [`SELECT COUNT(*) FROM ${dbManager.schema}.${tableName}`, rootWhereClause]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(sqlStatement, filterValues);

    return dbManager.getResultRows(result)[0].count;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
