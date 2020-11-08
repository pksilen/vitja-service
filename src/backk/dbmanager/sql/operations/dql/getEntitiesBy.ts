import shouldUseRandomInitializationVector from '../../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../../crypt/shouldEncryptValue';
import encrypt from '../../../../crypt/encrypt';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../../errors/createErrorResponseFromErrorMessageAndStatusCode';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbTransactionCount from "./utils/updateDbTransactionCount";

export default async function getEntitiesBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  try {
    updateDbTransactionCount(dbManager);

    const Types = dbManager.getTypes();
    const item = {
      [fieldName]: fieldValue
    };

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    const { columns, joinClause, sortClause, pagingClause } = getSqlSelectStatementParts(
      dbManager,
      postQueryOperations,
      entityClass,
      Types
    );

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinClause} WHERE ${fieldName} = $1 ${sortClause} ${pagingClause}`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item(s) with ${fieldName}: ${fieldValue} not found`,
        404
      );
    }

    return transformRowsToObjects(result, entityClass, postQueryOperations, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
