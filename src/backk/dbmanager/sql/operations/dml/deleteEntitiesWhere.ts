import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import entityContainer, { EntityJoinSpec } from '../../../../decorators/entity/entityAnnotationContainer';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import isErrorResponse from '../../../../errors/isErrorResponse';
import shouldUseRandomInitializationVector from '../../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../../crypt/shouldEncryptValue';
import encrypt from '../../../../crypt/encrypt';
import tryGetProjection from '../dql/clauses/tryGetProjection';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getSqlColumnFromProjection from '../dql/utils/columns/getSqlColumnFromProjection';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';

export default async function deleteEntitiesWhere<T extends object>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  EntityClass: new () => T
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
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

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          await dbManager.tryExecuteSql(
            `DELETE FROM ${dbManager.schema}.${joinSpec.subEntityTableName} WHERE ${joinSpec.subEntityForeignIdFieldName} IN (SELECT _id FROM ${dbManager.schema}.${EntityClass.name} WHERE ${fieldName} = $1)`,
            [fieldValue]
          );
        }
      ),
      forEachAsyncParallel(entityContainer.manyToManyRelationTableSpecs, async ({ associationTableName, entityForeignIdFieldName }) => {
        if (associationTableName.startsWith(EntityClass.name)) {
          await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${associationTableName} WHERE ${entityForeignIdFieldName} IN (SELECT _id FROM ${dbManager.schema}.${EntityClass.name} WHERE ${fieldName} = $1)`);
        }
      }),
      dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${EntityClass.name} WHERE ${fieldName} = $1`, [
        fieldValue
      ])
    ]);

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
