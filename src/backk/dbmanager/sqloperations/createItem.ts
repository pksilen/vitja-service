import { ErrorResponse } from '../../Backk';
import hashAndEncryptItem from '../../crypt/hashAndEncryptItem';
import getBadRequestErrorResponse from '../../getBadRequestErrorResponse';
import { getTypeMetadata } from '../../generateServicesMetadata';
import forEachAsyncParallel from '../../forEachAsyncParallel';
import _ from 'lodash';
import isErrorResponse from '../../isErrorResponse';
import getInternalServerErrorResponse from '../../getInternalServerErrorResponse';
import PostgreSqlDbManager from '../PostgreSqlDbManager';

export default async function createItem<T>(
  dbManager: PostgreSqlDbManager,
  item: Omit<T, '_id'>,
  entityClass: new () => T,
  Types: object,
  maxAllowedItemCount?: number,
  itemCountQueryFilter?: Partial<T>,
  isRecursiveCall = false
): Promise<T | ErrorResponse> {
  try {
    if (!isRecursiveCall) {
      await hashAndEncryptItem(item, entityClass, Types);
    }

    if (
      !dbManager.getClsNamespace()?.get('localTransaction') &&
      !dbManager.getClsNamespace()?.get('globalTransaction')
    ) {
      await dbManager.beginTransaction();
      dbManager.getClsNamespace()?.set('localTransaction', true);
    }

    if (!isRecursiveCall && maxAllowedItemCount !== undefined) {
      const itemCountOrErrorResponse = await dbManager.getItemsCount(
        itemCountQueryFilter,
        entityClass,
        Types
      );

      if (typeof itemCountOrErrorResponse === 'number') {
        if (itemCountOrErrorResponse >= maxAllowedItemCount) {
          return getBadRequestErrorResponse(
            'Cannot create new resource. Maximum resource count would be exceeded'
          );
        }
      } else {
        return itemCountOrErrorResponse;
      }
    }

    const entityMetadata = getTypeMetadata(entityClass as any);
    const additionalMetadata = Object.keys(item)
      .filter((itemKey) => itemKey.endsWith('Id'))
      .reduce((accumulatedMetadata, itemKey) => ({ ...accumulatedMetadata, [itemKey]: 'integer' }), {});
    const columns: any = [];
    const values: any = [];

    Object.entries({ ...entityMetadata, ...additionalMetadata }).forEach(
      ([fieldName, fieldTypeName]: [any, any]) => {
        let baseFieldTypeName = fieldTypeName;
        let isArray = false;

        if (fieldTypeName.endsWith('[]')) {
          baseFieldTypeName = fieldTypeName.slice(0, -2);
          isArray = true;
        }

        if (
          !isArray &&
          (baseFieldTypeName[0] !== baseFieldTypeName[0].toUpperCase() || baseFieldTypeName[0] === '(') &&
          fieldName !== '_id'
        ) {
          columns.push(fieldName);
          if (fieldName === 'id' || fieldName.endsWith('Id')) {
            values.push(parseInt((item as any)[fieldName], 10));
          } else {
            values.push((item as any)[fieldName]);
          }
        }
      }
    );

    const sqlColumns = columns.map((fieldName: any) => fieldName).join(', ');
    const sqlValuePlaceholders = columns.map((_: any, index: number) => `$${index + 1}`).join(', ');
    const getIdSqlStatement = Object.keys(entityMetadata).includes('_id') ? 'RETURNING _id' : '';

    const result = await dbManager.tryExecuteQuery(
      `INSERT INTO ${dbManager.schema}.${entityClass.name} (${sqlColumns}) VALUES (${sqlValuePlaceholders}) ${getIdSqlStatement}`,
      values
    );

    const _id = result.rows[0]?._id?.toString();

    await forEachAsyncParallel(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        let baseFieldTypeName = fieldTypeName;
        let isArray = false;
        const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';

        if (fieldTypeName.endsWith('[]')) {
          baseFieldTypeName = fieldTypeName.slice(0, -2);
          isArray = true;
        }

        if (
          isArray &&
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          if (
            _.uniqBy((item as any)[fieldName], (subItem: any) => subItem.id).length !==
            (item as any)[fieldName].length
          ) {
            throw new Error('Duplicate id values in ' + fieldName);
          }

          const relationEntityName = baseFieldTypeName;
          await forEachAsyncParallel((item as any)[fieldName], async (subItem: any) => {
            subItem[idFieldName] = _id;
            const subItemOrErrorResponse = await createItem(
              dbManager,
              subItem,
              (Types as any)[relationEntityName],
              Types,
              maxAllowedItemCount,
              itemCountQueryFilter,
              true
            );
            if ('errorMessage' in subItemOrErrorResponse && isErrorResponse(subItemOrErrorResponse)) {
              throw new Error(subItemOrErrorResponse.errorMessage);
            }
          });
        } else if (
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          const relationEntityName = baseFieldTypeName;
          const subItem = (item as any)[fieldName];
          subItem[idFieldName] = _id;
          const subItemOrErrorResponse = await createItem(
            dbManager,
            subItem,
            (Types as any)[relationEntityName],
            Types,
            maxAllowedItemCount,
            itemCountQueryFilter,
            true
          );
          if ('errorMessage' in subItemOrErrorResponse && isErrorResponse(subItemOrErrorResponse)) {
            throw new Error(subItemOrErrorResponse.errorMessage);
          }
        } else if (isArray) {
          await forEachAsyncParallel((item as any)[fieldName], async (subItem: any, index: number) => {
            const insertStatement = `INSERT INTO ${dbManager.schema}.${entityClass.name +
              fieldName.slice(0, -1)} (id, ${idFieldName}, ${fieldName.slice(
              0,
              -1
            )}) VALUES(${index}, $1, $2)`;
            await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
          });
        }
      }
    );

    if (!isRecursiveCall && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }

    return isRecursiveCall ? ({} as any) : dbManager.getItemById(_id, entityClass, Types);
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }

    return getInternalServerErrorResponse(error);
  } finally {
    dbManager.getClsNamespace()?.set('localTransaction', false);
  }
}
