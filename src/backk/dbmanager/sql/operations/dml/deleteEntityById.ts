import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import entityContainer, { JoinSpec } from '../../../../decorators/entity/entityAnnotationContainer';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from './getEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import getErrorResponse from '../../../../errors/getErrorResponse';
import getTypeMetadata from '../../../../metadata/getTypeMetadata';
import { getBadRequestErrorMessage } from '../../../../errors/getBadRequestErrorResponse';
import executePreHooks from '../../../hooks/executePreHooks';
import { PreHook } from '../../../hooks/PreHook';

export default async function deleteEntityById<T extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    if (Types && preHooks) {
      const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
      await executePreHooks(preHooks, itemOrErrorResponse);
    }

    const typeMetadata = getTypeMetadata(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(getBadRequestErrorMessage(idFieldName + ': must be a numeric id'));
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

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return getErrorResponse(error);
  }
}
