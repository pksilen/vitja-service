import hashAndEncryptItem from "../../../../crypt/hashAndEncryptItem";
import { getBadRequestErrorMessage } from "../../../../errors/getBadRequestErrorResponse";
import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import _ from "lodash";
import isErrorResponse from "../../../../errors/isErrorResponse";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";
import getTypeMetadata from "../../../../metadata/getTypeMetadata";
import executePreHooks from "../../../hooks/executePreHooks";
import { PreHook } from "../../../hooks/PreHook";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";

export default async function createEntity<T>(
  dbManager: PostgreSqlDbManager,
  entity: Omit<T, '_id'>,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[],
  postQueryOperations?: PostQueryOperations,
  isRecursiveCall = false,
  shouldReturnItem = true
): Promise<T | ErrorResponse> {
  // noinspection ExceptionCaughtLocallyJS
  try {
    const Types = dbManager.getTypes();

    if (!isRecursiveCall) {
      await hashAndEncryptItem(entity, entityClass, Types);
    }

    if (
      !dbManager.getClsNamespace()?.get('localTransaction') &&
      !dbManager.getClsNamespace()?.get('globalTransaction') &&
      shouldReturnItem
    ) {
      await dbManager.beginTransaction();
      dbManager.getClsNamespace()?.set('localTransaction', true);
    }

    if (!isRecursiveCall && preHooks) {
      await executePreHooks(preHooks);
    }

    const entityMetadata = getTypeMetadata(entityClass as any);
    const additionalMetadata = Object.keys(entity)
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
            const numericId = parseInt((entity as any)[fieldName], 10);
            if (isNaN(numericId)) {
              throw new Error(
                getBadRequestErrorMessage(entityClass.name + '.' + fieldName + ': must be a numeric id')
              );
            }
            values.push(numericId);
          } else {
            values.push((entity as any)[fieldName]);
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
            _.uniqBy((entity as any)[fieldName], (subItem: any) => subItem.id).length !==
            (entity as any)[fieldName].length
          ) {
            throw new Error(getBadRequestErrorMessage('Duplicate id values in ' + fieldName));
          }

          const relationEntityName = baseFieldTypeName;
          await forEachAsyncParallel((entity as any)[fieldName], async (subItem: any) => {
            subItem[idFieldName] = _id;
            const subItemOrErrorResponse: any | ErrorResponse = await createEntity(
              dbManager,
              subItem,
              (Types as any)[relationEntityName],
              preHooks,
              postQueryOperations,
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
          const subItem = (entity as any)[fieldName];
          subItem[idFieldName] = _id;
          const subItemOrErrorResponse: any | ErrorResponse = await createEntity(
            dbManager,
            subItem,
            (Types as any)[relationEntityName],
            preHooks,
            postQueryOperations,
            true
          );
          if ('errorMessage' in subItemOrErrorResponse && isErrorResponse(subItemOrErrorResponse)) {
            throw new Error(subItemOrErrorResponse.errorMessage);
          }
        } else if (isArray) {
          await forEachAsyncParallel((entity as any)[fieldName], async (subItem: any, index: number) => {
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

    if (!isRecursiveCall && shouldReturnItem && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }

    return isRecursiveCall || !shouldReturnItem
      ? ({} as any)
      : await dbManager.getEntityById(_id, entityClass, postQueryOperations);
  } catch (error) {
    if (isRecursiveCall) {
      throw error;
    }
    if (shouldReturnItem && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return getErrorResponse(error);
  } finally {
    if (!isRecursiveCall && shouldReturnItem) {
      dbManager.getClsNamespace()?.set('localTransaction', false);
    }
  }
}
