import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import createSubPaginationSelectStatement from './clauses/createSubPaginationSelectStatement';

export default async function getAllEntities<T>(
  dbManager: AbstractSqlDbManager,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const finalPostQueryOperations = postQueryOperations ?? {
    ...new DefaultPostQueryOperations(),
    pageSize: Number.MAX_SAFE_INTEGER
  };

  try {
    const { columns, joinClause, sortClause, pagingClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      EntityClass
    );

    const selectStatement = `SELECT ${columns} FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} ${joinClause} ${sortClause} ${pagingClause}`;

    const finalSelectStatement = createSubPaginationSelectStatement(
      selectStatement,
      finalPostQueryOperations.subPaginations
    );

    const result = await dbManager.tryExecuteQuery(finalSelectStatement);

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      postQueryOperations ?? { ...new DefaultPostQueryOperations(), pageSize: Number.MAX_SAFE_INTEGER },
      dbManager.getTypes()
    );
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
