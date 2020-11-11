import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { JoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import isErrorResponse from "../../../../errors/isErrorResponse";
import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import tryGetProjection from "../dql/clauses/tryGetProjection";
import createErrorMessageWithStatusCode from "../../../../errors/createErrorMessageWithStatusCode";
import getSqlColumnFromProjection from "../dql/utils/columns/getSqlColumnFromProjection";

export default async function deleteEntitiesBy<T extends object>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  entityClass: new () => T
): Promise<void | ErrorResponse> {
  const Types = dbManager.getTypes();
  let didStartTransaction = false;

  try {
    if (
      !dbManager.getClsNamespace()?.get('globalTransaction') &&
      !dbManager.getClsNamespace()?.get('localTransaction')
    ) {
      await dbManager.tryBeginTransaction();
      didStartTransaction = true;
      dbManager.getClsNamespace()?.set('localTransaction', true);
      dbManager
        .getClsNamespace()
        ?.set('dbLocalTransactionCount', dbManager.getClsNamespace()?.get('dbLocalTransactionCount') + 1);
    }

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

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
        async (joinSpec: JoinSpec) => {
          await dbManager.tryExecuteSql(
            `DELETE FROM ${dbManager.schema}.${joinSpec.joinTableName} WHERE ${joinSpec.joinTableFieldName} IN (SELECT _id FROM ${dbManager.schema}.${entityClass.name} WHERE ${fieldName} = $1)`,
            [fieldValue]
          );
        }
      ),
      dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${entityClass.name} WHERE ${fieldName} = $1`, [
        fieldValue
      ])
    ]);

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }
  } catch (errorOrErrorResponse) {
    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryRollbackTransaction();
    }
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    if (didStartTransaction) {
      dbManager.getClsNamespace()?.set('localTransaction', false);
    }
  }
}
