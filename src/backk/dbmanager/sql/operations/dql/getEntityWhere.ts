import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { BackkError } from "../../../../types/BackkError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import isUniqueField from "./utils/isUniqueField";
import SqlEquals from "../../expressions/SqlEquals";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
import getTableName from "../../../utils/getTableName";
import createErrorResponseFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorResponseFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../../../../errors/backkErrors";

export default async function getEntityWhere<T>(
  dbManager: AbstractSqlDbManager,
  fieldPathName: string,
  fieldValue: any,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<[T, BackkError | null]> {
  if (!isUniqueField(fieldPathName, EntityClass, dbManager.getTypes())) {
    throw new Error(`Field ${fieldPathName} is not unique. Annotate entity field with @Unique annotation`);
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

  try {
    const lastDotPosition = fieldPathName.lastIndexOf('.');
    const fieldName = lastDotPosition === -1 ? fieldPathName : fieldPathName.slice(lastDotPosition + 1);

    const filters = [
      new SqlEquals(
        { [fieldName]: fieldValue },
        lastDotPosition === -1 ? '' : fieldPathName.slice(0, lastDotPosition)
      )
    ];

    const {
      rootWhereClause,
      columns,
      joinClauses,
      filterValues,
      outerSortClause
    } = getSqlSelectStatementParts(dbManager, finalPostQueryOperations, EntityClass, filters);

    const tableName = getTableName(EntityClass.name);
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootWhereClause,
      `LIMIT 1) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.ENTITY_NOT_FOUND,
        errorMessage: `${EntityClass.name} with ${fieldName}: ${fieldValue} not found`
      });
    }

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      finalPostQueryOperations,
      dbManager.getTypes()
    )[0];
  } catch (error) {
    return createBackkErrorFromError(error);
  }
}
