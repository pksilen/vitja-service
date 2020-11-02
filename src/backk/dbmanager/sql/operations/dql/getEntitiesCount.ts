import SqlExpression from '../../expressions/SqlExpression';
import { pg } from 'yesql';
import tryGetWhereClause from './clauses/tryGetWhereClause';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getFilterValues from './utils/getFilterValues';
import getJoinClause from './clauses/getJoinClause';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";

export default async function getEntitiesCount<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[] | undefined,
  entityClass: new () => T
): Promise<number | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    const { joinClause, whereClause, filterValues } = getSqlSelectStatementParts(
      dbManager,
      new DefaultPostQueryOperations(),
      entityClass,
      Types
    );

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(`SELECT COUNT(*) FROM ${dbManager.schema}.${entityClass.name} ${joinClause} ${whereClause}`)(
        filterValues
      )
    );

    return result.rows[0].count;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}