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
import getSqlColumnFromProjection from './utils/columns/getSqlColumnFromProjection';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import { HttpStatusCodes } from '../../../../constants/constants';
import createSubPaginationSelectStatement from './clauses/createSubPaginationSelectStatement';
import isUniqueField from './utils/isUniqueField';

export default async function getEntityWhere<T>(
  dbManager: AbstractSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  if (isUniqueField(fieldName, EntityClass, dbManager.getTypes())) {
    throw new Error(`Field ${fieldName} is not unique. Annotate entity field with @Unique annotation`);
  }

  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();
  const finalPostQueryOperations = postQueryOperations ?? {
    ...new DefaultPostQueryOperations(),
    pageSize: 1
  };

  try {
    let projection;
    try {
      projection = tryGetProjection(
        dbManager,
        { includeResponseFields: [fieldName] },
        EntityClass,
        Types,
        true
      );
    } catch (error) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Invalid query filter field name: ' + fieldName,
        HttpStatusCodes.BAD_REQUEST
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

    const selectStatement = `SELECT ${columns} FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} ${joinClause} WHERE ${finalFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
      1
    )}`;

    const finalSelectStatement = createSubPaginationSelectStatement(
      selectStatement,
      finalPostQueryOperations.subPaginations
    );

    const result = await dbManager.tryExecuteQuery(finalSelectStatement, [finalFieldValue]);

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
      Types
    )[0];
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
