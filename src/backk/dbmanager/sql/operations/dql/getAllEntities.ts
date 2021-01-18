import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';

export default async function getAllEntities<T>(
  dbManager: AbstractSqlDbManager,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);

  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  const finalPostQueryOperations: PostQueryOperations = postQueryOperations ?? {
    ...new DefaultPostQueryOperations(),
    paginations: []
  };

  try {
    const { columns, joinClauses, rootSortClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      EntityClass
    );

    const selectStatement = `SELECT ${columns} FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} as ${EntityClass.name.toLowerCase()} ${joinClauses} ${rootSortClause}`;
    const result = await dbManager.tryExecuteQuery(selectStatement);

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      finalPostQueryOperations,
      dbManager.getTypes()
    );
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
