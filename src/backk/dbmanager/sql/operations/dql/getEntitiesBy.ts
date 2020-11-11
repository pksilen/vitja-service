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
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import tryGetProjection from "./clauses/tryGetProjection";
import createErrorMessageWithStatusCode from "../../../../errors/createErrorMessageWithStatusCode";
import getSqlColumnFromProjection from "./utils/columns/getSqlColumnFromProjection";
import { HttpStatusCodes } from "../../../../constants/constants";

export default async function getEntitiesBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  entityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    updateDbLocalTransactionCount(dbManager);

    let projection;
    try {
      projection = tryGetProjection(dbManager.schema, { includeResponseFields: [fieldName] }, entityClass, Types);
    } catch (error) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(createErrorMessageWithStatusCode('Invalid field name: ' + fieldName, 400));
    }

    // noinspection AssignmentToFunctionParameterJS
    fieldName = getSqlColumnFromProjection(projection);

    const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
    if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
      // noinspection AssignmentToFunctionParameterJS
      fieldValue = encrypt(fieldValue as any, false);
    }

    const { columns, joinClause, sortClause, pagingClause } = getSqlSelectStatementParts(
      dbManager,
      postQueryOperations,
      entityClass,
      Types
    );

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinClause} WHERE ${fieldName} = $1 ${sortClause} ${pagingClause}`,
      [fieldValue]
    );

    if (result.rows.length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item(s) with ${fieldName}: ${fieldValue} not found`,
        HttpStatusCodes.NOT_FOUND
      );
    }

    return transformRowsToObjects(result, entityClass, postQueryOperations, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
