import hashAndEncryptEntity from '../../../../crypt/hashAndEncryptEntity';
import isErrorResponse from '../../../../errors/isErrorResponse';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import getEntityById from '../dql/getEntityById';
import { RecursivePartial } from '../../../../types/RecursivePartial';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { Entity } from '../../../../types/entities/Entity';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import getSubEntitiesByAction from './utils/getSubEntitiesByAction';
import deleteEntityById from './deleteEntityById';
import createEntity from './createEntity';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import { PostHook } from '../../../hooks/PostHook';
import tryExecutePostHook from '../../../hooks/tryExecutePostHook';
import createErrorFromErrorCodeMessageAndStatus from '../../../../errors/createErrorFromErrorCodeMessageAndStatus';
import { BACKK_ERRORS } from '../../../../errors/backkErrors';

export default async function updateEntity<T extends Entity>(
  dbManager: AbstractSqlDbManager,
  { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
  EntityClass: new () => T,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook,
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    const Types = dbManager.getTypes();

    if (!isRecursiveCall) {
      await hashAndEncryptEntity(restOfEntity, EntityClass as any, Types);
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    let currentEntityOrErrorResponse: T | ErrorResponse | undefined;

    if (!isRecursiveCall) {
      currentEntityOrErrorResponse = await getEntityById(dbManager, _id ?? id, EntityClass, undefined, true);
    }

    let eTagCheckPreHook: PreHook<T>;
    let finalPreHooks = Array.isArray(preHooks) ? preHooks ?? [] : preHooks ? [preHooks] : [];

    if (typeof currentEntityOrErrorResponse === 'object') {
      if (
        'version' in currentEntityOrErrorResponse &&
        restOfEntity.version &&
        restOfEntity.version !== 'any'
      ) {
        eTagCheckPreHook = {
          isSuccessfulOrTrue: ({ version }) => version === restOfEntity.version,
          errorMessage: BACKK_ERRORS.ENTITY_VERSION_MISMATCH
        };

        finalPreHooks = [eTagCheckPreHook, ...finalPreHooks];
      } else if (
        'lastModifiedTimestamp' in currentEntityOrErrorResponse &&
        (restOfEntity as any).lastModifiedTimestamp &&
        (restOfEntity as any).lastModifiedTimestamp.getTime() !== 0
      ) {
        eTagCheckPreHook = {
          isSuccessfulOrTrue: ({ lastModifiedTimestamp }) =>
            lastModifiedTimestamp?.getTime() === (restOfEntity as any).lastModifiedTimestamp.getTime(),
          errorMessage: BACKK_ERRORS.ENTITY_LAST_MODIFIED_TIMESTAMP_MISMATCH
        };

        finalPreHooks = [eTagCheckPreHook, ...finalPreHooks];
      }
    }

    if (!isRecursiveCall) {
      await tryExecutePreHooks(finalPreHooks, currentEntityOrErrorResponse);
    }

    const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);
    const columns: any = [];
    const values: any = [];
    const promises: Array<Promise<any>> = [];

    await forEachAsyncSequential(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        if (
          (restOfEntity as any)[fieldName] === undefined &&
          fieldName !== 'version' &&
          fieldName !== 'lastModifiedTimestamp'
        ) {
          return;
        }

        if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
          return;
        }

        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
        const foreignIdFieldName =
          EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
        const idFieldName = _id === undefined ? 'id' : '_id';
        let subEntityOrEntities = (restOfEntity as any)[fieldName];
        const SubEntityClass = (Types as any)[baseTypeName];

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          // noinspection ReuseOfLocalVariableJS
          const finalAllowAdditionAndRemovalForSubEntities = 'all';

          if (
            finalAllowAdditionAndRemovalForSubEntities === 'all'
          ) {
            const { subEntitiesToDelete, subEntitiesToAdd, subEntitiesToUpdate } = getSubEntitiesByAction(
              subEntityOrEntities,
              (currentEntityOrErrorResponse as any)[fieldName]
            );

            promises.push(
              forEachAsyncParallel(subEntitiesToDelete, async (subEntity: any) => {
                if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
                  const associationTableName = `${EntityClass.name}_${SubEntityClass}`;
                  const {
                    entityForeignIdFieldName,
                    subEntityForeignIdFieldName
                  } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTableName);
                  await dbManager.tryExecuteSql(
                    `DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                      1
                    )} AND ${subEntityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                      2
                    )}`,
                    [parseInt(_id ?? id, 10), subEntity._id]
                  );
                } else {
                  const possibleErrorResponse = await deleteEntityById(
                    dbManager,
                    subEntity.id,
                    SubEntityClass
                  );
                  if (possibleErrorResponse) {
                    throw possibleErrorResponse;
                  }
                }
              })
            );

            promises.push(
              forEachAsyncParallel(subEntitiesToAdd, async (subEntity: any) => {
                if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
                  const associationTableName = `${EntityClass.name}_${SubEntityClass}`;
                  const {
                    entityForeignIdFieldName,
                    subEntityForeignIdFieldName
                  } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTableName);
                  dbManager.tryExecuteSql(
                    `INSERT INTO ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} (${entityForeignIdFieldName.toLowerCase()}, ${subEntityForeignIdFieldName.toLowerCase()}) VALUES (${dbManager.getValuePlaceholder(
                      1
                    )}, ${dbManager.getValuePlaceholder(2)})`,
                    [parseInt(_id ?? id, 10), subEntity._id]
                  );
                } else {
                  const createdEntityOrErrorResponse = await createEntity(
                    dbManager,
                    subEntity,
                    SubEntityClass,
                    undefined,
                    undefined,
                    undefined,
                    false,
                    false
                  );
                  if (isErrorResponse(createdEntityOrErrorResponse)) {
                    throw createdEntityOrErrorResponse;
                  }
                }
              })
            );

            // noinspection ReuseOfLocalVariableJS
            subEntityOrEntities = subEntitiesToUpdate;
          }

          if (!typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
            promises.push(
              forEachAsyncParallel(subEntityOrEntities, async (subEntity: any) => {
                subEntity[foreignIdFieldName] = _id;
                const possibleErrorResponse = await updateEntity(
                  dbManager,
                  subEntity,
                  SubEntityClass,
                  undefined,
                  undefined,
                  true
                );

                if (possibleErrorResponse) {
                  throw possibleErrorResponse;
                }
              })
            );
          }
        } else if (isEntityTypeName(baseTypeName) && subEntityOrEntities !== null) {
          subEntityOrEntities[foreignIdFieldName] = _id;

          const possibleErrorResponse = await updateEntity(
            dbManager,
            subEntityOrEntities,
            (Types as any)[baseTypeName],
            undefined,
            undefined,
            true
          );

          if (possibleErrorResponse) {
            throw possibleErrorResponse;
          }
        } else if (isArrayType) {
          const numericId = parseInt(_id, 10);
          if (isNaN(numericId)) {
            // noinspection ExceptionCaughtLocallyJS
            throw createErrorFromErrorCodeMessageAndStatus({
              ...BACKK_ERRORS.INVALID_ARGUMENT,
              errorMessage:
                BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + idFieldName + ': must be a numeric id'
            });
          }

          promises.push(
            forEachAsyncParallel((restOfEntity as any)[fieldName], async (subItem: any, index) => {
              const deleteStatement = `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase() +
                '_' +
                fieldName
                  .slice(0, -1)
                  .toLowerCase()} WHERE ${foreignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                1
              )}`;
              await dbManager.tryExecuteSql(deleteStatement, [_id]);

              const insertStatement = `INSERT INTO ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase() +
                '_' +
                fieldName
                  .slice(0, -1)
                  .toLowerCase()} (id, ${foreignIdFieldName.toLowerCase()}, ${fieldName
                .slice(0, -1)
                .toLowerCase()}) VALUES(${index}, ${dbManager.getValuePlaceholder(
                1
              )}, ${dbManager.getValuePlaceholder(2)})`;
              await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
            })
          );
        } else if (fieldName !== '_id' && fieldName !== 'id') {
          if (fieldName === 'version') {
            columns.push(fieldName);
            values.push((parseInt((currentEntityOrErrorResponse as any).version, 10) + 1).toString());
          } else if (fieldName === 'lastModifiedTimestamp') {
            columns.push(fieldName);
            values.push(new Date());
          } else {
            columns.push(fieldName);
            values.push((restOfEntity as any)[fieldName]);
          }
        }
      }
    );

    const setStatements = columns
      .map(
        (fieldName: string, index: number) =>
          fieldName.toLowerCase() + ' = ' + dbManager.getValuePlaceholder(index + 1)
      )
      .join(', ');

    const idFieldName = _id === undefined ? 'id' : '_id';
    let numericId: number | undefined;

    if (_id !== undefined || id !== undefined) {
      numericId = parseInt(_id ?? id, 10);

      if (isNaN(numericId)) {
        // noinspection ExceptionCaughtLocallyJS
        throw createErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS.INVALID_ARGUMENT,
          errorMessage: BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + idFieldName + ': must be a numeric id'
        });
      }
    }

    if (setStatements) {
      let sqlStatement = `UPDATE ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} SET ${setStatements}`;

      if (numericId !== undefined) {
        sqlStatement += ` WHERE ${idFieldName} = ${dbManager.getValuePlaceholder(columns.length + 1)}`;
      }

      promises.push(
        dbManager.tryExecuteSql(sqlStatement, numericId === undefined ? values : [...values, numericId])
      );
    }

    await Promise.all(promises);

    if (postHook) {
      await tryExecutePostHook(postHook);
    }

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
