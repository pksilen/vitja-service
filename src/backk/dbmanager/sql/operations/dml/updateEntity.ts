import hashAndEncryptItem from '../../../../crypt/hashAndEncryptItem';
import isErrorResponse from '../../../../errors/isErrorResponse';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from '../dql/getEntityById';
import { RecursivePartial } from '../../../../types/RecursivePartial';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getTypeMetadata from '../../../../metadata/getTypeMetadata';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { Entity } from '../../../../types/Entity';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';

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
    }

    if (shouldCheckIfItemExists) {
      const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
      if ('errorMessage' in itemOrErrorResponse && isErrorResponse(itemOrErrorResponse)) {
        // noinspection ExceptionCaughtLocallyJS
        throw itemOrErrorResponse;
      }

      if (preHooks) {
        await tryExecutePreHooks(preHooks, itemOrErrorResponse);
      }
    }

    const entityMetadata = getTypeMetadata(entityClass as any);
    const columns: any = [];
    const values: any = [];
    const promises: Array<Promise<any>> = [];

    await forEachAsyncSequential(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        if ((restOfItem as any)[fieldName] === undefined) {
          return;
        }

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
          promises.push(
            forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
              const possibleErrorResponse = await updateEntity(
                dbManager,
                subItem,
                (Types as any)[baseFieldTypeName],
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
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          const possibleErrorResponse = await updateEntity(
            dbManager,
            (restOfItem as any)[fieldName],
            (Types as any)[baseFieldTypeName],
            undefined,
            false,
            true
          );

          if (possibleErrorResponse) {
            throw possibleErrorResponse;
          }
        } else if (isArray) {
          const numericId = parseInt(_id, 10);
          if (isNaN(numericId)) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(createErrorMessageWithStatusCode(idFieldName + ': must be a numeric id', 400));
          }

          promises.push(
            forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any, index) => {
              const deleteStatement = `DELETE FROM ${dbManager.schema}.${entityClass.name +
                fieldName.slice(0, -1)} WHERE ${idFieldName} = $1`;
              await dbManager.tryExecuteSql(deleteStatement, [_id]);

              const insertStatement = `INSERT INTO ${dbManager.schema}.${entityClass.name +
                fieldName.slice(0, -1)} (id, ${idFieldName}, ${fieldName.slice(
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
