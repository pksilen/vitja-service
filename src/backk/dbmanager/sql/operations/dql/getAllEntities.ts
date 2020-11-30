import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';

export default async function getAllEntities<T>(
  dbManager: PostgreSqlDbManager,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass.name);
  const Types = dbManager.getTypes();

  try {
    const { columns, joinClause, sortClause, pagingClause } = getSqlSelectStatementParts(
      dbManager,
      postQueryOperations ?? { ...new DefaultPostQueryOperations(), pageSize: Number.MAX_SAFE_INTEGER },
      EntityClass,
      Types
    );

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${columns} FROM ${dbManager.schema}.${EntityClass.name} ${joinClause} ${sortClause} ${pagingClause}`
    );

    return transformRowsToObjects(
      result,
      EntityClass,
      postQueryOperations ?? { ...new DefaultPostQueryOperations(), pageSize: Number.MAX_SAFE_INTEGER },
      Types
    );
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
