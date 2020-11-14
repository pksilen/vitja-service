import hashAndEncryptItem from '../../../../crypt/hashAndEncryptItem';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import _ from 'lodash';
import isErrorResponse from '../../../../errors/isErrorResponse';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getPropertyNameToPropertyTypeNameMap from '../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getTypeInfoFromMetadataType from '../../../../utils/type/getTypeInfoFromMetadataType';

export default async function createEntity<T>(
  dbManager: PostgreSqlDbManager,
  entity: Omit<T, '_id'>,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[],
  postQueryOperations?: PostQueryOperations,
  isRecursiveCall = false,
  shouldReturnItem = true
): Promise<T | ErrorResponse> {
  let didStartTransaction = false;
  let sqlStatement;
  // noinspection ExceptionCaughtLocallyJS
  try {
    const Types = dbManager.getTypes();

    if (!isRecursiveCall) {
      await hashAndEncryptItem(entity, entityClass, Types);
    }

    if (
      !dbManager.getClsNamespace()?.get('localTransaction') &&
      !dbManager.getClsNamespace()?.get('globalTransaction')
    ) {
      await dbManager.tryBeginTransaction();
      didStartTransaction = true;
      dbManager.getClsNamespace()?.set('localTransaction', true);
      dbManager
        .getClsNamespace()
        ?.set('dbLocalTransactionCount', dbManager.getClsNamespace()?.get('dbLocalTransactionCount') + 1);
    }

    if (!isRecursiveCall && preHooks) {
      await tryExecutePreHooks(preHooks);
    }

    const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);
    const additionalMetadata = Object.keys(entity)
      .filter((itemKey) => itemKey.endsWith('Id'))
      .reduce((accumulatedMetadata, itemKey) => ({ ...accumulatedMetadata, [itemKey]: 'integer' }), {});
    const columns: any = [];
    const values: any = [];

    Object.entries({ ...entityMetadata, ...additionalMetadata }).forEach(
      ([fieldName, fieldTypeName]: [any, any]) => {
        const { baseTypeName, isArrayType } = getTypeInfoFromMetadataType(fieldTypeName);

        if (
          !isArrayType &&
          (baseTypeName[0] !== baseTypeName[0].toUpperCase() ||
            baseTypeName[0] === '(' ||
            baseTypeName === 'Date') &&
          fieldName !== '_id'
        ) {
          columns.push(fieldName);
          if (fieldName === 'id' || fieldName.endsWith('Id')) {
            const numericId = parseInt((entity as any)[fieldName], 10);
            if (isNaN(numericId)) {
              throw new Error(
                createErrorMessageWithStatusCode(
                  entityClass.name + '.' + fieldName + ': must be a numeric id',
                  400
                )
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
    sqlStatement = `INSERT INTO ${dbManager.schema}.${entityClass.name} (${sqlColumns}) VALUES (${sqlValuePlaceholders}) ${getIdSqlStatement}`;
    const result = await dbManager.tryExecuteQuery(sqlStatement, values);
    const _id = result.rows[0]?._id?.toString();

    await forEachAsyncParallel(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        const {baseTypeName, isArrayType } = getTypeInfoFromMetadataType(fieldTypeName);
        const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';

        if (
          isArrayType &&
          baseTypeName !== 'Date' &&
          baseTypeName[0] === baseTypeName[0].toUpperCase() &&
          baseTypeName[0] !== '('
        ) {
          if (
            _.uniqBy((entity as any)[fieldName], (subItem: any) => subItem.id).length !==
            (entity as any)[fieldName].length
          ) {
            throw new Error(createErrorMessageWithStatusCode('Duplicate id values in ' + fieldName, 400));
          }

          const relationEntityName = baseTypeName;
          await forEachAsyncParallel((entity as any)[fieldName], async (subItem: any, index) => {
            subItem[idFieldName] = _id;

            if (subItem.id === undefined) {
              subItem.id = index;
            } else {
              if (parseInt(subItem.id, 10) !== index) {
                throw new Error(
                  createErrorMessageWithStatusCode(
                    'Invalid id values in ' +
                      fieldName +
                      '. Id values must be consecutive numbers starting from zero.',
                    400
                  )
                );
              }
            }

            const subItemOrErrorResponse: any | ErrorResponse = await createEntity(
              dbManager,
              subItem,
              (Types as any)[relationEntityName],
              preHooks,
              postQueryOperations,
              true
            );
            if ('errorMessage' in subItemOrErrorResponse && isErrorResponse(subItemOrErrorResponse)) {
              throw subItemOrErrorResponse;
            }
          });
        } else if (
          baseTypeName !== 'Date' &&
          baseTypeName[0] === baseTypeName[0].toUpperCase() &&
          baseTypeName[0] !== '('
        ) {
          const relationEntityName = baseTypeName;
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
            throw subItemOrErrorResponse;
          }
        } else if (isArrayType) {
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

    const response =
      isRecursiveCall || !shouldReturnItem
        ? ({} as any)
        : await dbManager.getEntityById(_id, entityClass, postQueryOperations);

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }

    return response;
  } catch (errorOrErrorResponse) {
    if (isRecursiveCall) {
      throw errorOrErrorResponse;
    }

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
