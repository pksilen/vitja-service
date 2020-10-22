import { ErrorResponse } from '../../../Backk';
import forEachAsyncParallel from '../../../forEachAsyncParallel';
import entityContainer, { JoinSpec } from '../../../annotations/entity/entityAnnotationContainer';
import getInternalServerErrorResponse from '../../../getInternalServerErrorResponse';
import PostgreSqlDbManager from '../../PostgreSqlDbManager';

export default async function deleteAllItems<T>(
  dbManager: PostgreSqlDbManager,
  entityClass: new () => T
): Promise<void | ErrorResponse> {
  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
        async (joinSpec: JoinSpec) => {
          await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${joinSpec.joinTableName}`);
        }
      ),
      dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${entityClass.name}`)
    ]);

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return getInternalServerErrorResponse(error);
  }
}
