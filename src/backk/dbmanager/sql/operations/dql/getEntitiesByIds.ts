import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../../errors/createErrorResponseFromErrorMessageAndStatusCode';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import { HttpStatusCodes } from '../../../../constants/constants';

export default async function getEntitiesByIds<T>(
  dbManager: AbstractSqlDbManager,
  _ids: string[],
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  try {
    updateDbLocalTransactionCount(dbManager);

    const { rootSortClause, rootPaginationClause, columns, joinClauses } = getSqlSelectStatementParts(
      dbManager,
      postQueryOperations,
      EntityClass
    );

    const numericIds = _ids.map((id) => {
      const numericId = parseInt(id, 10);

      if (isNaN(numericId)) {
        throw new Error(
          createErrorMessageWithStatusCode('All ids must be a numeric ids', HttpStatusCodes.BAD_REQUEST)
        );
      }

      return numericId;
    });

    const idPlaceholders = _ids.map((_, index) => dbManager.getValuePlaceholder(index + 1)).join(', ');
    const tableName = EntityClass.name.toLowerCase();
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();
    const selectStatement = `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}  WHERE _id IN (${idPlaceholders}) ${rootSortClause} ${rootPaginationClause}) AS ${tableAlias} ${joinClauses}`;
    const result = await dbManager.tryExecuteQuery(selectStatement, numericIds);

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item with _ids: ${_ids} not found`,
        HttpStatusCodes.NOT_FOUND
      );
    }

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
