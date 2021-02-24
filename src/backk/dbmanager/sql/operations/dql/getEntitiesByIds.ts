import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { BackkError } from "../../../../types/BackkError";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import getTableName from "../../../utils/getTableName";
import createBackkErrorFromErrorCodeMessageAndStatus
  from "../../../../errors/createBackkErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../../../../errors/backkErrors";

export default async function getEntitiesByIds<T>(
  dbManager: AbstractSqlDbManager,
  _ids: string[],
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<[T[], BackkError | null]> {
  try {
    updateDbLocalTransactionCount(dbManager);

    const {
      rootSortClause,
      rootPaginationClause,
      columns,
      joinClauses,
      outerSortClause
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, EntityClass);

    const numericIds = _ids.map((id) => {
      const numericId = parseInt(id, 10);

      if (isNaN(numericId)) {
        throw createBackkErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS.INVALID_ARGUMENT,
          errorMessage: BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + ' all _ids must be numeric values'
        });
      }

      return numericId;
    });

    const idPlaceholders = _ids.map((_, index) => dbManager.getValuePlaceholder(index + 1)).join(', ');
    const tableName = getTableName(EntityClass.name);
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName} WHERE _id IN (${idPlaceholders})`,
      rootSortClause,
      rootPaginationClause,
      `) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQuery(selectStatement, numericIds);

    if (dbManager.getResultRows(result).length === 0) {
      return createBackkErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.ENTITY_NOT_FOUND,
        errorMessage: `${EntityClass.name}s with _ids: ${_ids.join(', ')} not found`
      });
    }

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      postQueryOperations,
      dbManager.getTypes()
    );
  } catch (error) {
    return createBackkErrorFromError(error);
  }
}
