import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { JoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import getItemById from "./getItemById";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";
import getTypeMetadata from "../../../../metadata/getTypeMetadata";
import { getBadRequestErrorMessage } from "../../../../errors/getBadRequestErrorResponse";
import { PreHook } from "../../../AbstractDbManager";
import executePreHooks from "../../../hooks/executePreHooks";

export default async function deleteItemById<T extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  Types?: object,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  if (preHooks && !Types) {
    throw new Error('Types argument must be given if preCondition argument is given');
  }

  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    if (Types && preHooks) {
      const itemOrErrorResponse = await getItemById(dbManager, _id, entityClass, Types);
      await executePreHooks(preHooks, itemOrErrorResponse);
    }

    const typeMetadata = getTypeMetadata(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      throw new Error(
        getBadRequestErrorMessage(idFieldName + ': must be a numeric id')
      );
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
