import { ErrorResponse } from '../../Backk';
import isErrorResponse from '../../isErrorResponse';
import _ from 'lodash';
import getConflictErrorResponse from '../../getConflictErrorResponse';
import { getTypeMetadata } from '../../generateServicesMetadata';
import forEachAsyncParallel from '../../forEachAsyncParallel';
import entityContainer, { JoinSpec } from '../../annotations/entity/entityAnnotationContainer';
import getInternalServerErrorResponse from '../../getInternalServerErrorResponse';
import PostgreSqlDbManager from '../PostgreSqlDbManager';
import getItemById from './getItemById';

export default async function deleteItemById<T extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  Types?: object,
  itemPreCondition?: Partial<T> | string
): Promise<void | ErrorResponse> {
  if (itemPreCondition && !Types) {
    throw new Error('Types argument must be given if preCondition argument is given');
  }

  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    if (Types && itemPreCondition) {
      const itemOrErrorResponse = await getItemById(dbManager, _id, entityClass, Types);
      if ('errorMessage' in itemOrErrorResponse && isErrorResponse(itemOrErrorResponse)) {
        console.log(itemOrErrorResponse);
        return itemOrErrorResponse;
      }

      if (typeof itemPreCondition === 'object') {
        if (!_.isMatch(itemOrErrorResponse, itemPreCondition)) {
          return getConflictErrorResponse(
            `Delete precondition ${JSON.stringify(itemPreCondition)} was not satisfied`
          );
        }
      } else {
        // noinspection DynamicallyGeneratedCodeJS
        if (
          !new Function('const obj = arguments[0]; return ' + itemPreCondition).call(
            null,
            itemOrErrorResponse
          )
        ) {
          return getConflictErrorResponse(`Delete precondition ${itemPreCondition} was not satisfied`);
        }
      }
    }

    const typeMetadata = getTypeMetadata(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
        async (joinSpec: JoinSpec) => {
          await dbManager.tryExecuteSql(
            `DELETE FROM ${dbManager.schema}.${joinSpec.joinTableName} WHERE ${joinSpec.joinTableFieldName} = $1`,
            [_id]
          );
        }
      ),
      dbManager.tryExecuteSql(
        `DELETE FROM ${dbManager.schema}.${entityClass.name} WHERE ${dbManager.schema}.${entityClass.name}.${idFieldName} = $1`,
        [_id]
      )
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
