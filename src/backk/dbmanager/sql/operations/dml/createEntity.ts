import hashAndEncryptItem from '../../../../crypt/hashAndEncryptItem';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import isErrorResponse from '../../../../errors/isErrorResponse';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import { HttpStatusCodes } from '../../../../constants/constants';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';

export default async function createEntity<T>(
  dbManager: AbstractSqlDbManager,
  entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
  EntityClass: new () => T,
  preHooks?: PreHook | PreHook[],
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
      await hashAndEncryptItem(entity, EntityClass, Types);
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    if (!isRecursiveCall && preHooks) {
      await tryExecutePreHooks(preHooks);
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
          if (fieldName === 'id' || fieldName.endsWith('Id')) {
            const numericId = parseInt((entity as any)[fieldName], 10);
            if (isNaN(numericId)) {
              throw new Error(
                createErrorMessageWithStatusCode(
                  EntityClass.name + '.' + fieldName + ': must be a numeric id',
                  HttpStatusCodes.BAD_REQUEST
                )
              );
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

    const sqlColumns = columns.map((fieldName: any) => fieldName).join(', ');
    const sqlValuePlaceholders = columns
      .map((_: any, index: number) => dbManager.getValuePlaceholder(index + 1))
      .join(', ');

    const getIdSqlStatement = Object.keys(entityMetadata).includes('_id')
      ? dbManager.getReturningIdClause()
      : '';

    sqlStatement = `INSERT INTO ${dbManager.schema}.${EntityClass.name} (${sqlColumns}) VALUES (${sqlValuePlaceholders}) ${getIdSqlStatement}`;
    const result = await dbManager.tryExecuteQuery(sqlStatement, values);
    const _id = dbManager.getInsertId(result).toString();

    await forEachAsyncParallel(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
        const foreignIdFieldName =
          EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
        const subEntityOrEntities = (entity as any)[fieldName];

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          await forEachAsyncParallel(subEntityOrEntities, async (subEntity: any, index) => {
            const SubEntityClass = (Types as any)[baseTypeName];
            if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
              let subEntityOrErrorResponse: any | ErrorResponse = await dbManager.getEntityById(
                subEntity._id ?? '',
                SubEntityClass
              );
              if ('errorMessage' in subEntityOrErrorResponse) {
                subEntityOrErrorResponse = await createEntity(
                  dbManager,
                  subEntity,
                  SubEntityClass,
                  undefined,
                  undefined,
                  true,
                  false
                );
                if ('errorMessage' in subEntityOrErrorResponse) {
                  // noinspection ExceptionCaughtLocallyJS
                  throw subEntityOrErrorResponse;
                }
              }

              const associationTableName = `${EntityClass.name}_${SubEntityClass.name}`;
              const {
                entityForeignIdFieldName,
                subEntityForeignIdFieldName
              } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTableName);

              await dbManager.tryExecuteSql(
                `INSERT INTO ${
                  dbManager.schema
                }.${associationTableName} (${entityForeignIdFieldName}, ${subEntityForeignIdFieldName}) VALUES (${dbManager.getValuePlaceholder(
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
                  throw new Error(
                    createErrorMessageWithStatusCode(
                      'Invalid id values in ' +
                        fieldName +
                        '. Id values must be consecutive numbers starting from zero.',
                      HttpStatusCodes.BAD_REQUEST
                    )
                  );
                }
              }

              const subEntityOrErrorResponse: any | ErrorResponse = await createEntity(
                dbManager,
                subEntity,
                SubEntityClass,
                preHooks,
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
            postQueryOperations,
            true,
            false
          );
          if ('errorMessage' in subEntityOrErrorResponse && isErrorResponse(subEntityOrErrorResponse)) {
            throw subEntityOrErrorResponse;
          }
        } else if (isArrayType) {
          await forEachAsyncParallel((entity as any)[fieldName], async (subItem: any, index: number) => {
            const insertStatement = `INSERT INTO ${dbManager.schema}.${EntityClass.name +
              '_' +
              fieldName.slice(0, -1)} (id, ${foreignIdFieldName}, ${fieldName.slice(
              0,
              -1
            )}) VALUES(${index}, ${dbManager.getValuePlaceholder(1)}, ${dbManager.getValuePlaceholder(2)})`;
            await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
          });
        }
      }
    );

    const response =
      isRecursiveCall || !shouldReturnItem
        ? ({ _id } as any)
        : await dbManager.getEntityById(_id, EntityClass, postQueryOperations);

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return response;
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
