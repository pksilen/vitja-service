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
import tryGetProjection from './clauses/tryGetProjection';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getSqlColumnFromProjection from './utils/columns/getSqlColumnFromProjection';
import { HttpStatusCodes } from '../../../../constants/constants';
import createSubPaginationSelectStatement from './clauses/createSubPaginationSelectStatement';

export default async function getEntitiesWhere<T>(
  dbManager: AbstractSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();

  try {
    updateDbLocalTransactionCount(dbManager);

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

    const { rootSortClause, columns, joinClauses, rootSortClause, rootPaginationClause } = getSqlSelectStatementParts(
      dbManager,
      postQueryOperations,
      EntityClass,
      undefined,
      false,
      true
    );

    let selectStatement;
    if (fieldName.includes('.')) {
      selectStatement = `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} as root WHERE ${finalFieldName} = ${dbManager.getValuePlaceholder(
        1
      )} ${rootSortClause}) ${rootPaginationClause}) ${joinClauses}  ${rootSortClause}`;
    } else
    {
      selectStatement = `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} as root ${rootSortClause} ${rootPaginationClause}) ${joinClauses} WHERE ${finalFieldName} = ${dbManager.getValuePlaceholder(
        1
      )} ${rootSortClause}`;
    }

    const finalSelectStatement = createSubPaginationSelectStatement(
      selectStatement,
      postQueryOperations.subPaginations
    );

    const result = await dbManager.tryExecuteQuery(finalSelectStatement, [finalFieldValue]);

    if (dbManager.getResultRows(result).length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item(s) with ${fieldName}: ${fieldValue} not found`,
        HttpStatusCodes.NOT_FOUND
      );
    }

    return transformRowsToObjects(dbManager.getResultRows(result), EntityClass, postQueryOperations, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
