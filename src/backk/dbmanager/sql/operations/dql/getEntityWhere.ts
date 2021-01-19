import shouldUseRandomInitializationVector from '../../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../../crypt/shouldEncryptValue';
import encrypt from '../../../../crypt/encrypt';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../../errors/createErrorResponseFromErrorMessageAndStatusCode';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import { HttpStatusCodes } from '../../../../constants/constants';
import isUniqueField from './utils/isUniqueField';
import SqlEquals from '../../expressions/SqlEquals';

export default async function getEntityWhere<T>(
  dbManager: AbstractSqlDbManager,
  subEntityPath: string,
  fieldName: string,
  fieldValue: any,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  if (!isUniqueField(fieldName, EntityClass, dbManager.getTypes())) {
    throw new Error(`Field ${fieldName} is not unique. Annotate entity field with @Unique annotation`);
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

  try {
    const filters = [new SqlEquals(subEntityPath, { [fieldName]: fieldValue })];

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      // noinspection AssignmentToFunctionParameterJS
      fieldValue = encrypt(fieldValue, false);
    }

    const {
      rootWhereClause,
      columns,
      joinClauses,
      filterValues
    } = getSqlSelectStatementParts(dbManager, finalPostQueryOperations, EntityClass, filters);

    const tableName = EntityClass.name.toLowerCase();
    const selectStatement = `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName} ${rootWhereClause} LIMIT 1) AS ${tableName} ${joinClauses}`;
    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item with ${fieldName}: ${fieldValue} not found`,
        HttpStatusCodes.NOT_FOUND
      );
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
