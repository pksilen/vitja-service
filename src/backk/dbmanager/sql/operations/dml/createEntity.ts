import hashAndEncryptEntity from "../../../../crypt/hashAndEncryptEntity";
import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import isErrorResponse from "../../../../errors/isErrorResponse";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getClassPropertyNameToPropertyTypeNameMap
  from "../../../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import tryExecutePreHooks from "../../../hooks/tryExecutePreHooks";
import { PreHook } from "../../../hooks/PreHook";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import getTypeInfoForTypeName from "../../../../utils/type/getTypeInfoForTypeName";
import isEntityTypeName from "../../../../utils/type/isEntityTypeName";
import tryStartLocalTransactionIfNeeded from "../transaction/tryStartLocalTransactionIfNeeded";
import tryCommitLocalTransactionIfNeeded from "../transaction/tryCommitLocalTransactionIfNeeded";
import tryRollbackLocalTransactionIfNeeded from "../transaction/tryRollbackLocalTransactionIfNeeded";
import cleanupLocalTransactionIfNeeded from "../transaction/cleanupLocalTransactionIfNeeded";
import typePropertyAnnotationContainer
  from "../../../../decorators/typeproperty/typePropertyAnnotationContainer";
import entityAnnotationContainer from "../../../../decorators/entity/entityAnnotationContainer";
import { PostHook } from "../../../hooks/PostHook";
import tryExecutePostHook from "../../../hooks/tryExecutePostHook";
import { Entity } from "../../../../types/entities/Entity";
import { SubEntity } from "../../../../types/entities/SubEntity";
import createErrorResponseFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorResponseFromErrorCodeMessageAndStatus";
import createErrorFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../../../../errors/backkErrors";
import tryExecuteCreatePreHooks from "../../../hooks/tryExecuteCreatePreHooks";
import { CreatePreHook } from "../../../hooks/CreatePreHook";

export default async function createEntity<T extends Entity | SubEntity>(
  dbManager: AbstractSqlDbManager,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
  EntityClass: new () => T,
  preHooks?: CreatePreHook | CreatePreHook[],
  postHook?: PostHook,
  postQueryOperations?: PostQueryOperations,
  isRecursiveCall = false,
  shouldReturnItem = true
): Promise<T | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;
  let sqlStatement;

  // noinspection ExceptionCaughtLocallyJS
  try {
    const Types = dbManager.getTypes();

    if (!isRecursiveCall) {
      await hashAndEncryptEntity(entity, EntityClass, Types);
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    if (!isRecursiveCall && preHooks) {
      await tryExecuteCreatePreHooks(preHooks);
    }

    const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);
    const additionalMetadata = Object.keys(entity)
      .filter((itemKey) => itemKey.endsWith('Id'))
      .reduce((accumulatedMetadata, itemKey) => ({ ...accumulatedMetadata, [itemKey]: 'integer' }), {});
    const columns: any = [];
    const values: any = [];

    Object.entries({ ...entityMetadata, ...additionalMetadata }).forEach(
      ([fieldName, fieldTypeName]: [any, any]) => {
        if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
          return;
        }

        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);

        if (!isArrayType && !isEntityTypeName(baseTypeName) && fieldName !== '_id') {
          columns.push(fieldName);

          if (
            (fieldName === 'id' || fieldName.endsWith('Id')) &&
            !typePropertyAnnotationContainer.isTypePropertyExternalId(EntityClass, fieldName)
          ) {
            const numericId = parseInt((entity as any)[fieldName], 10);

            if (isNaN(numericId)) {
              throw createErrorFromErrorCodeMessageAndStatus({
                ...BACKK_ERRORS.INVALID_ARGUMENT,
                errorMessage:
                  BACKK_ERRORS.INVALID_ARGUMENT.errorMessage +
                  EntityClass.name +
                  '.' +
                  fieldName +
                  ': must be a numeric id'
              });
            }

            values.push(numericId);
          } else {
            if (fieldName === 'version') {
              values.push('1');
            } else if (fieldName === 'lastModifiedTimestamp' || fieldName === 'createdAtTimestamp') {
              values.push(new Date());
            } else {
              values.push((entity as any)[fieldName]);
            }
          }
        }
      }
    );

    const sqlColumns = columns.map((fieldName: any) => fieldName.toLowerCase()).join(', ');
    const sqlValuePlaceholders = columns
      .map((_: any, index: number) => dbManager.getValuePlaceholder(index + 1))
      .join(', ');

    const getIdSqlStatement = Object.keys(entityMetadata).includes('_id')
      ? dbManager.getReturningIdClause()
      : '';

    sqlStatement = `INSERT INTO ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} (${sqlColumns}) VALUES (${sqlValuePlaceholders}) ${getIdSqlStatement}`;
    const result = await dbManager.tryExecuteQuery(sqlStatement, values);
    const _id = dbManager.getInsertId(result)?.toString();

    await forEachAsyncParallel(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
        const foreignIdFieldName =
          EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
        const subEntityOrEntities = (entity as any)[fieldName];

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          await forEachAsyncParallel(subEntityOrEntities ?? [], async (subEntity: any, index) => {
            const SubEntityClass = (Types as any)[baseTypeName];
            if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
              const subEntityOrErrorResponse: any | ErrorResponse = await dbManager.getEntityById(
                subEntity._id ?? '',
                SubEntityClass
              );

              if ('errorMessage' in subEntityOrErrorResponse) {
                // noinspection ExceptionCaughtLocallyJS
                throw subEntityOrErrorResponse;
              }

              const associationTableName = `${EntityClass.name}_${SubEntityClass.name}`;
              const {
                entityForeignIdFieldName,
                subEntityForeignIdFieldName
              } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTableName);

              await dbManager.tryExecuteSql(
                `INSERT INTO ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} (${entityForeignIdFieldName.toLowerCase()}, ${subEntityForeignIdFieldName.toLowerCase()}) VALUES (${dbManager.getValuePlaceholder(
                  1
                )}, ${dbManager.getValuePlaceholder(2)})`,
                [_id, subEntityOrErrorResponse._id]
              );
            } else {
              subEntity[foreignIdFieldName] = _id;
              if (subEntity.id === undefined) {
                subEntity.id = index;
              } else {
                if (parseInt(subEntity.id, 10) !== index) {
                  throw createErrorFromErrorCodeMessageAndStatus({
                    ...BACKK_ERRORS.INVALID_ARGUMENT,
                    errorMessage:
                      BACKK_ERRORS.INVALID_ARGUMENT.errorMessage +
                      EntityClass.name +
                      '.' +
                      fieldName +
                      ': id values must be consecutive numbers starting from zero'
                  });
                }
              }

              const subEntityOrErrorResponse: any | ErrorResponse = await createEntity(
                dbManager,
                subEntity,
                SubEntityClass,
                preHooks,
                postHook,
                postQueryOperations,
                true,
                false
              );

              if ('errorMessage' in subEntityOrErrorResponse && isErrorResponse(subEntityOrErrorResponse)) {
                throw subEntityOrErrorResponse;
              }
            }
          });
        } else if (isEntityTypeName(baseTypeName) && subEntityOrEntities !== null) {
          const relationEntityName = baseTypeName;
          subEntityOrEntities[foreignIdFieldName] = _id;
          const subEntityOrErrorResponse: any | ErrorResponse = await createEntity(
            dbManager,
            subEntityOrEntities,
            (Types as any)[relationEntityName],
            preHooks,
            postHook,
            postQueryOperations,
            true,
            false
          );
          if ('errorMessage' in subEntityOrErrorResponse && isErrorResponse(subEntityOrErrorResponse)) {
            throw subEntityOrErrorResponse;
          }
        } else if (isArrayType) {
          await forEachAsyncParallel((entity as any)[fieldName], async (subItem: any, index: number) => {
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
          });
        }
      }
    );

    const response =
      isRecursiveCall || !shouldReturnItem
        ? ({ _id } as any)
        : await dbManager.getEntityById(_id, EntityClass, postQueryOperations);

    if (!isRecursiveCall && postHook) {
      await tryExecutePostHook(postHook, response);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return response;
  } catch (errorOrErrorResponse) {
    if (isRecursiveCall) {
      throw errorOrErrorResponse;
    }

    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);

    if ('message' in errorOrErrorResponse && dbManager.isDuplicateEntityError(errorOrErrorResponse)) {
      return createErrorResponseFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.DUPLICATE_ENTITY,
        errorMessage: `Duplicate ${EntityClass.name.charAt(0).toLowerCase()}${EntityClass.name.slice(1)}`
      });
    }

    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
