import hashAndEncryptItem from '../../../../crypt/hashAndEncryptItem';
import isErrorResponse from '../../../../errors/isErrorResponse';
import { JSONPath } from 'jsonpath-plus';
import { getConflictErrorMessage } from '../../../../errors/getConflictErrorResponse';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getItemById from './getItemById';
import { RecursivePartial } from '../../../../types/RecursivePartial';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import getErrorResponse from '../../../../errors/getErrorResponse';
import getTypeMetadata from '../../../../metadata/getTypeMetadata';
import { getBadRequestErrorMessage } from '../../../../errors/getBadRequestErrorResponse';

export default async function updateItem<T extends object & { _id: string; id?: string }>(
  dbManager: PostgreSqlDbManager,
  { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
  entityClass: new () => T,
  Types: object,
  preCondition?: Partial<T> | string,
  shouldCheckIfItemExists: boolean = true,
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  try {
    if (!isRecursiveCall) {
      await hashAndEncryptItem(restOfItem, entityClass, Types);
    }

    if (
      !dbManager.getClsNamespace()?.get('transaction') &&
      !dbManager.getClsNamespace()?.get('globalTransaction')
    ) {
      await dbManager.beginTransaction();
      dbManager.getClsNamespace()?.set('localTransaction', true);
    }

    if (shouldCheckIfItemExists) {
      const itemOrErrorResponse = await getItemById(dbManager, _id, entityClass, Types);
      if ('errorMessage' in itemOrErrorResponse && isErrorResponse(itemOrErrorResponse)) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(itemOrErrorResponse.errorMessage);
      }

      if (typeof preCondition === 'object') {
        const isPreConditionMatched = Object.entries(preCondition).reduce(
          (isPreconditionMatched, [path, value]) => {
            return isPreconditionMatched && JSONPath({ json: itemOrErrorResponse, path })[0] === value;
          },
          true
        );
        if (!isPreConditionMatched) {
          // noinspection ExceptionCaughtLocallyJS
          throw new Error(
            getConflictErrorMessage(
              `Delete sub item precondition ${JSON.stringify(preCondition)} was not satisfied`
            )
          );
        }
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
              const possibleErrorResponse = await updateItem(
                dbManager,
                subItem,
                (Types as any)[baseFieldTypeName],
                Types,
                undefined,
                false,
                true
              );
              if (possibleErrorResponse) {
                throw new Error(possibleErrorResponse.errorMessage);
              }
            })
          );
        } else if (
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          const possibleErrorResponse = await updateItem(
            dbManager,
            (restOfItem as any)[fieldName],
            (Types as any)[baseFieldTypeName],
            Types,
            undefined,
            false,
            true
          );
          if (possibleErrorResponse) {
            throw new Error(possibleErrorResponse.errorMessage);
          }
        } else if (isArray) {
          const numericId = parseInt(_id, 10);
          if (isNaN(numericId)) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(getBadRequestErrorMessage(idFieldName + ': must be a numeric id'));
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

    const numericId = parseInt(_id === undefined ? (restOfItem.id ?? 0) : (_id as any), 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        getBadRequestErrorMessage(entityClass.name + '.' + idFieldName + ': must be a numeric id')
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

    if (!isRecursiveCall && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    if (isRecursiveCall) {
      throw error;
    }
    return getErrorResponse(error);
  } finally {
    dbManager.getClsNamespace()?.set('localTransaction', false);
  }
}
