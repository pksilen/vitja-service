import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getClassPropertyNameToPropertyTypeNameMap
  from "../../../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import getTableName from "../../../utils/getTableName";
import createErrorResponseFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorResponseFromErrorCodeMessageAndStatus";
import createErrorFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../../../../errors/backkErrors";

export default async function getEntityById<T>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations,
  isInternalCall = false
): Promise<T | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

  try {
    if (
      postQueryOperations?.includeResponseFields?.length === 1 &&
      postQueryOperations.includeResponseFields[0] === '_id'
    ) {
      return { _id } as any;
    }
    
    const { columns, joinClauses, outerSortClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      EntityClass,
      undefined,
      isInternalCall
    );

    const typeMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);

    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw createErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.INVALID_ARGUMENT,
        errorMessage: BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + idFieldName + ' must be a numeric id'
      });
    }

    const tableName = getTableName(EntityClass.name);
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      `WHERE ${idFieldName} = ${dbManager.getValuePlaceholder(1)} LIMIT 1) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQuery(selectStatement, [numericId]);

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.ENTITY_NOT_FOUND,
        errorMessage: `${EntityClass.name} with _id: ${_id} not found`
      });
    }

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      finalPostQueryOperations,
      dbManager.getTypes()
    )[0];
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
