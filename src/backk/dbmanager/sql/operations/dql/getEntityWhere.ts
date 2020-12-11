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
import tryGetProjection from './clauses/tryGetProjection';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getSqlColumnFromProjection from './utils/columns/getSqlColumnFromProjection';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import { HttpStatusCodes } from '../../../../constants/constants';

export default async function getEntityWhere<T>(
  dbManager: AbstractSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  if (
    !fieldName.includes('.') &&
    !typePropertyAnnotationContainer.isTypePropertyUnique(EntityClass, fieldName)
  ) {
    throw new Error(`Field ${EntityClass}.${fieldName} values must be annotated with @Unique annotation`);
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();
  const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

  try {
    let projection;
    try {
      projection = tryGetProjection(
        dbManager.schema,
        { includeResponseFields: [fieldName] },
        EntityClass,
        Types,
        true
      );
    } catch (error) {
      console.log(error);
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        createErrorMessageWithStatusCode(
          'Invalid query filter field name: ' + fieldName,
          HttpStatusCodes.BAD_REQUEST
        )
      );
    }

    const finalFieldName = getSqlColumnFromProjection(projection);

    const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
    let finalFieldValue = fieldValue;
    if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
      finalFieldValue = encrypt(fieldValue as any, false);
    }

    const { columns, joinClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      EntityClass
    );

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${columns} FROM ${dbManager.schema.toLowerCase()}.${
        EntityClass.name.toLowerCase()
      } ${joinClause} WHERE ${finalFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(1)}`,
      [finalFieldValue]
    );

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item with ${fieldName}: ${fieldValue} not found`,
        HttpStatusCodes.NOT_FOUND
      );
    } else if (dbManager.getResultRows(result).length > 1) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Field ${fieldName} values must be unique`,
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    return transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      finalPostQueryOperations,
      Types
    )[0];
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
