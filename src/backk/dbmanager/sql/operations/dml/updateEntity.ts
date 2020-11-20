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
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import { HttpStatusCodes } from '../../../../constants/constants';
import { UpdateMode } from '../../../AbstractDbManager';
import getSubEntitiesByAction from './utils/getSubEntitiesByAction';
import deleteEntityById from './deleteEntityById';
import createEntity from './createEntity';

export default async function updateEntity<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
  EntityClass: new () => T,
  preHooks?: PreHook | PreHook[],
  subEntitiesUpdateMode: UpdateMode = 'patch',
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  let didStartTransaction = false;

  try {
    const Types = dbManager.getTypes();
    if (!isRecursiveCall) {
      await hashAndEncryptItem(restOfEntity, EntityClass as any, Types);
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    let currentEntityOrErrorResponse: T | ErrorResponse | undefined;
    if (!isRecursiveCall || subEntitiesUpdateMode === 'update') {
      currentEntityOrErrorResponse = await getEntityById(dbManager, _id ?? id, EntityClass, undefined, true);
    }
    if (!isRecursiveCall) {
      await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    }

    const entityMetadata = getPropertyNameToPropertyTypeNameMap(EntityClass as any);
    const columns: any = [];
    const values: any = [];
    const promises: Array<Promise<any>> = [];

    await forEachAsyncSequential(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        if ((restOfEntity as any)[fieldName] === undefined) {
          return;
        }

        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
        const foreignIdFieldName =
          EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
        const idFieldName = _id === undefined ? 'id' : '_id';
        let subEntityOrEntities = (restOfEntity as any)[fieldName];

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          // noinspection ReuseOfLocalVariableJS
          if (subEntitiesUpdateMode === 'update') {
            const { subEntitiesToDelete, subEntitiesToAdd, subEntitiesToUpdate } = getSubEntitiesByAction(
              subEntityOrEntities,
              (currentEntityOrErrorResponse as any)[fieldName]
            );

            promises.push(
              forEachAsyncParallel(subEntitiesToDelete, async (subEntity: any) => {
                const possibleErrorResponse = await deleteEntityById(
                  dbManager,
                  subEntity.id,
                  (Types as any)[baseTypeName]
                );

                if (possibleErrorResponse) {
                  throw possibleErrorResponse;
                }
              })
            );

            promises.push(
              forEachAsyncParallel(subEntitiesToDelete, async (subEntity: any) => {
                const createdEntityOrErrorResponse = await createEntity(
                  dbManager,
                  subEntity,
                  (Types as any)[baseTypeName],
                  undefined,
                  undefined,
                  false,
                  false
                );

                if (isErrorResponse(createdEntityOrErrorResponse)) {
                  throw createdEntityOrErrorResponse;
                }
              })
            );

            // noinspection ReuseOfLocalVariableJS
            subEntityOrEntities = subEntitiesToUpdate;
          }
          promises.push(
            forEachAsyncParallel(subEntityOrEntities, async (subEntity: any) => {
              subEntity[foreignIdFieldName] = _id;
              const possibleErrorResponse = await updateEntity(
                dbManager,
                subEntity,
                (Types as any)[baseTypeName],
                undefined,
                subEntitiesUpdateMode,
                true
              );

              if (possibleErrorResponse) {
                throw possibleErrorResponse;
              }
            })
          );
        } else if (isEntityTypeName(baseTypeName) && subEntityOrEntities !== null) {
          subEntityOrEntities[foreignIdFieldName] = _id;
          const possibleErrorResponse = await updateEntity(
            dbManager,
            subEntityOrEntities,
            (Types as any)[baseTypeName],
            undefined,
            subEntitiesUpdateMode,
            true
          );

          if (possibleErrorResponse) {
            throw possibleErrorResponse;
          }
        } else if (isArrayType) {
          const numericId = parseInt(_id, 10);
          if (isNaN(numericId)) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              createErrorMessageWithStatusCode(
                idFieldName + ': must be a numeric id',
                HttpStatusCodes.BAD_REQUEST
              )
            );
          }

          promises.push(
            forEachAsyncParallel((restOfEntity as any)[fieldName], async (subItem: any, index) => {
              const deleteStatement = `DELETE FROM ${dbManager.schema}.${EntityClass.name +
                fieldName.slice(0, -1)} WHERE ${foreignIdFieldName} = $1`;
              await dbManager.tryExecuteSql(deleteStatement, [_id]);

              const insertStatement = `INSERT INTO ${dbManager.schema}.${EntityClass.name +
                fieldName.slice(0, -1)} (id, ${foreignIdFieldName}, ${fieldName.slice(
                0,
                -1
              )}) VALUES(${index}, $1, $2)`;
              await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
            })
          );
        } else if (fieldName !== '_id' && fieldName !== 'id') {
          if ((restOfEntity as any)[fieldName] !== undefined) {
            columns.push(fieldName);
            values.push((restOfEntity as any)[fieldName]);
          }
        }
      }
    );

    const setStatements = columns
      .map((fieldName: string, index: number) => fieldName + ' = ' + `$${index + 2}`)
      .join(', ');

    const idFieldName = _id === undefined ? 'id' : '_id';

    const numericId = parseInt(_id === undefined ? id ?? 0 : (_id as any), 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        createErrorMessageWithStatusCode(
          EntityClass.name + '.' + idFieldName + ': must be a numeric id',
          HttpStatusCodes.BAD_REQUEST
        )
      );
    }

    if (setStatements) {
      promises.push(
        dbManager.tryExecuteSql(
          `UPDATE ${dbManager.schema}.${EntityClass.name} SET ${setStatements} WHERE ${idFieldName} = $1`,
          [numericId, ...values]
        )
      );
    }

    await Promise.all(promises);
    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
  } catch (errorOrErrorResponse) {
    if (isRecursiveCall) {
      throw errorOrErrorResponse;
    }
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
