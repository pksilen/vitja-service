import hashAndEncryptItem from '../../../../crypt/hashAndEncryptItem';
import isErrorResponse from '../../../../errors/isErrorResponse';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from '../dql/getEntityById';
import { RecursivePartial } from '../../../../types/RecursivePartial';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getPropertyNameToPropertyTypeNameMap from '../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { Entity } from '../../../../types/Entity';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';

export default async function updateEntity<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[],
  shouldCheckIfItemExists: boolean = true,
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  let didStartTransaction = false;

  try {
    const Types = dbManager.getTypes();
    if (!isRecursiveCall) {
      await hashAndEncryptItem(restOfItem, entityClass as any, Types);
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

    if (shouldCheckIfItemExists) {
      const currentEntityOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
      await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    }

    const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);
    const columns: any = [];
    const values: any = [];
    const promises: Array<Promise<any>> = [];

    await forEachAsyncSequential(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        if ((restOfItem as any)[fieldName] === undefined) {
          return;
        }

        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
        const foreignIdFieldName =
          entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';
        const idFieldName = _id === undefined ? 'id' : '_id';

        if (
          isArrayType &&
          baseTypeName !== 'Date' &&
          baseTypeName[0] === baseTypeName[0].toUpperCase() &&
          baseTypeName[0] !== '('
        ) {
          promises.push(
            forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
              subItem[foreignIdFieldName] = _id;
              const possibleErrorResponse = await updateEntity(
                dbManager,
                subItem,
                (Types as any)[baseTypeName],
                undefined,
                false,
                true
              );

              if (possibleErrorResponse) {
                throw possibleErrorResponse;
              }
            })
          );
        } else if (
          baseTypeName !== 'Date' &&
          baseTypeName[0] === baseTypeName[0].toUpperCase() &&
          baseTypeName[0] !== '('
        ) {
          const subItem = (restOfItem as any)[fieldName];
          subItem[foreignIdFieldName] = _id;
          const possibleErrorResponse = await updateEntity(
            dbManager,
            subItem,
            (Types as any)[baseTypeName],
            undefined,
            false,
            true
          );

          if (possibleErrorResponse) {
            throw possibleErrorResponse;
          }
        } else if (isArrayType) {
          const numericId = parseInt(_id, 10);
          if (isNaN(numericId)) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(createErrorMessageWithStatusCode(idFieldName + ': must be a numeric id', 400));
          }

          promises.push(
            forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any, index) => {
              const deleteStatement = `DELETE FROM ${dbManager.schema}.${entityClass.name +
                fieldName.slice(0, -1)} WHERE ${foreignIdFieldName} = $1`;
              await dbManager.tryExecuteSql(deleteStatement, [_id]);

              const insertStatement = `INSERT INTO ${dbManager.schema}.${entityClass.name +
                fieldName.slice(0, -1)} (id, ${foreignIdFieldName}, ${fieldName.slice(
                0,
                -1
              )}) VALUES(${index}, $1, $2)`;
              await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
            })
          );
        } else if (fieldName !== '_id' && fieldName !== 'id') {
          if ((restOfItem as any)[fieldName] !== undefined) {
            columns.push(fieldName);
            values.push((restOfItem as any)[fieldName]);
          }
        }
      }
    );

    const setStatements = columns
      .map((fieldName: string, index: number) => fieldName + ' = ' + `$${index + 2}`)
      .join(', ');

    const idFieldName = _id === undefined ? 'id' : '_id';

    const numericId = parseInt(_id === undefined ? restOfItem.id ?? 0 : (_id as any), 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        createErrorMessageWithStatusCode(entityClass.name + '.' + idFieldName + ': must be a numeric id', 400)
      );
    }

    if (setStatements) {
      promises.push(
        dbManager.tryExecuteSql(
          `UPDATE ${dbManager.schema}.${entityClass.name} SET ${setStatements} WHERE ${idFieldName} = $1`,
          [numericId, ...values]
        )
      );
    }

    await Promise.all(promises);

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }
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
