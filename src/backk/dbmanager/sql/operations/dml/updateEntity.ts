import hashAndEncryptItem from '../../../../crypt/hashAndEncryptItem';
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
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import { HttpStatusCodes } from '../../../../constants/constants';
import getSubEntitiesByAction from './utils/getSubEntitiesByAction';
import deleteEntityById from './deleteEntityById';
import createEntity from './createEntity';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';

export default async function updateEntity<T extends Entity>(
  dbManager: AbstractSqlDbManager,
  { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
  EntityClass: new () => T,
  allowAdditionAndRemovalForSubEntityClasses: (new () => any)[] | 'all',
  preHooks?: PreHook | PreHook[],
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const finalAllowAdditionAndRemovalForSubEntities = Array.isArray(allowAdditionAndRemovalForSubEntityClasses)
    ? allowAdditionAndRemovalForSubEntityClasses.map((SubEntityClass) => dbManager.getType(SubEntityClass))
    : allowAdditionAndRemovalForSubEntityClasses;
  let didStartTransaction = false;

  try {
    const Types = dbManager.getTypes();
    if (!isRecursiveCall) {
      await hashAndEncryptItem(restOfEntity, EntityClass as any, Types);
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    let currentEntityOrErrorResponse: T | ErrorResponse | undefined;
    if (!isRecursiveCall || allowAdditionAndRemovalForSubEntityClasses) {
      currentEntityOrErrorResponse = await getEntityById(dbManager, _id ?? id, EntityClass, undefined, true);
    }
    if (!isRecursiveCall) {
      await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    }

    const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);
    const columns: any = [];
    const values: any = [];
    const promises: Array<Promise<any>> = [];

    await forEachAsyncSequential(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        if ((restOfEntity as any)[fieldName] === undefined) {
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
          if (
            finalAllowAdditionAndRemovalForSubEntities === 'all' ||
            finalAllowAdditionAndRemovalForSubEntities?.includes(SubEntityClass)
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
                    `DELETE FROM ${
                      dbManager.schema.toLowerCase()
                    }.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                      1
                    )} AND ${subEntityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(2)}`,
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
                    `INSERT INTO ${
                      dbManager.schema.toLowerCase()
                    }.${associationTableName.toLowerCase()} (${entityForeignIdFieldName.toLowerCase()}, ${subEntityForeignIdFieldName.toLowerCase()}) VALUES (${dbManager.getValuePlaceholder(
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
                  allowAdditionAndRemovalForSubEntityClasses,
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
            allowAdditionAndRemovalForSubEntityClasses,
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
            throw new Error(
              createErrorMessageWithStatusCode(
                idFieldName + ': must be a numeric id',
                HttpStatusCodes.BAD_REQUEST
              )
            );
          }

          promises.push(
            forEachAsyncParallel((restOfEntity as any)[fieldName], async (subItem: any, index) => {
              const deleteStatement = `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase() +
                '_' +
                fieldName.slice(0, -1).toLowerCase()} WHERE ${foreignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(1)}`;
              await dbManager.tryExecuteSql(deleteStatement, [_id]);

              const insertStatement = `INSERT INTO ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase() +
                '_' +
                fieldName.slice(0, -1).toLowerCase()} (id, ${foreignIdFieldName.toLowerCase()}, ${fieldName.slice(
                0,
                -1
              ).toLowerCase()}) VALUES(${index}, ${dbManager.getValuePlaceholder(1)}, ${dbManager.getValuePlaceholder(2)})`;
              await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
            })
          );
        } else if (fieldName !== '_id' && fieldName !== 'id') {
          if ((restOfEntity as any)[fieldName] !== undefined) {
            columns.push(fieldName);
            if (fieldName === 'version') {
              values.push((parseInt((currentEntityOrErrorResponse as any).version, 10) + 1).toString());
            } else if (fieldName === 'lastModifiedTimestamp') {
              values.push(new Date());
            } else {
              values.push((restOfEntity as any)[fieldName]);
            }
          }
        }
      }
    );

    const setStatements = columns
      .map((fieldName: string, index: number) => fieldName.toLowerCase() + ' = ' + dbManager.getValuePlaceholder(index + 1))
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
          `UPDATE ${dbManager.schema.toLowerCase()}.${
            EntityClass.name.toLowerCase()
          } SET ${setStatements} WHERE ${idFieldName} = ${dbManager.getValuePlaceholder(columns.length + 1)}`,
          [...values, numericId]
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
