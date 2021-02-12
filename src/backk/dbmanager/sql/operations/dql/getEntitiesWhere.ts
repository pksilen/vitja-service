import shouldUseRandomInitializationVector from '../../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../../crypt/shouldEncryptValue';
import encrypt from '../../../../crypt/encrypt';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../../errors/createErrorResponseFromErrorMessageAndStatusCode';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import { HttpStatusCodes } from '../../../../constants/constants';
import isUniqueField from './utils/isUniqueField';
import SqlEquals from '../../expressions/SqlEquals';
import getTableName from "../../../utils/getTableName";
import createErrorResponseFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorResponseFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS_ENTITY_NOT_FOUND } from "../../../../errors/backkErrors";

export default async function getEntitiesWhere<T>(
  dbManager: AbstractSqlDbManager,
  fieldPathName: string,
  fieldValue: any,
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  if (!isUniqueField(fieldPathName, EntityClass, dbManager.getTypes())) {
    throw new Error(`Field ${fieldPathName} is not unique. Annotate entity field with @Unique annotation`);
  }

  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    updateDbLocalTransactionCount(dbManager);

    let finalFieldValue = fieldValue;
    const lastDotPosition = fieldPathName.lastIndexOf('.');
    const fieldName = lastDotPosition === -1 ? fieldPathName : fieldPathName.slice(lastDotPosition + 1);
    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      finalFieldValue = encrypt(fieldValue, false);
    }

    const filters = [
      new SqlEquals(
        { [fieldName]: finalFieldValue },
        lastDotPosition === -1 ? '' : fieldPathName.slice(0, lastDotPosition)
      )
    ];

    const {
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      columns,
      joinClauses,
      filterValues,
      outerSortClause
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, EntityClass, filters);

    const tableName = getTableName(EntityClass.name);
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      `) AS ${tableAlias}`,
      joinClauses,
      outerSortClause
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS_ENTITY_NOT_FOUND,
        errorMessage: `Entity with ${fieldName}: ${fieldValue} not found`
      });
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
