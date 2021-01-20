import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import Pagination from '../../../../types/postqueryoperations/Pagination';

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
    paginations: [new Pagination('', 1, Number.MAX_SAFE_INTEGER)]
  };

  try {
    const { columns, joinClauses, rootSortClause, outerSortClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      EntityClass
    );

    const tableName = EntityClass.name.toLowerCase();
    const tableAlias = dbManager.schema + '_' + tableName;

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootSortClause,
      `) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

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
