import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import entityContainer, { JoinSpec } from '../../../../decorators/entity/entityAnnotationContainer';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from '../dql/getEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getPropertyNameToPropertyTypeNameMap from '../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import isErrorResponse from "../../../../errors/isErrorResponse";

export default async function deleteEntityById<T extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
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

    if (preHooks) {
      const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
      await tryExecutePreHooks(preHooks, itemOrErrorResponse);
    }

    const typeMetadata = getPropertyNameToPropertyTypeNameMap(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(createErrorMessageWithStatusCode(idFieldName + ': must be a numeric id', 400));
    }

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
        async (joinSpec: JoinSpec) => {
          await dbManager.tryExecuteSql(
            `DELETE FROM ${dbManager.schema}.${joinSpec.joinTableName} WHERE ${joinSpec.joinTableFieldName} = $1`,
            [numericId]
          );
        }
      ),
      dbManager.tryExecuteSql(
        `DELETE FROM ${dbManager.schema}.${entityClass.name} WHERE ${dbManager.schema}.${entityClass.name}.${idFieldName} = $1`,
        [numericId]
      )
    ]);

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }
  } catch (errorOrErrorResponse) {
    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryRollbackTransaction();
    }
    return isErrorResponse(errorOrErrorResponse) ? errorOrErrorResponse: createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    if (didStartTransaction) {
      dbManager.getClsNamespace()?.set('localTransaction', false);
    }
  }
}
