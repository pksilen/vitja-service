import isErrorResponse from '../../../../errors/isErrorResponse';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { RecursivePartial } from '../../../../types/RecursivePartial';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getPropertyNameToPropertyTypeNameMap from '../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import { Entity } from '../../../../types/Entity';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import shouldUseRandomInitializationVector from '../../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../../crypt/shouldEncryptValue';
import encrypt from '../../../../crypt/encrypt';
import tryGetProjection from '../dql/clauses/tryGetProjection';
import getSqlColumnFromProjection from '../dql/utils/columns/getSqlColumnFromProjection';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import { HttpStatusCodes } from '../../../../constants/constants';
import getEntityById from '../dql/getEntityById';
import { PreHook } from '../../../hooks/PreHook';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';

export default async function updateEntitiesBy<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
  EntityClass: new () => T,
  preHooks?: PreHook | PreHook[],
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass.name);
  const Types = dbManager.getTypes();
  let didStartTransaction = false;

  try {
    let projection;
    try {
      projection = tryGetProjection(
        dbManager.schema,
        { includeResponseFields: [fieldName] },
        EntityClass,
        Types
      );
    } catch (error) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        createErrorMessageWithStatusCode('Invalid field name: ' + fieldName, HttpStatusCodes.BAD_REQUEST)
      );
    }

    // noinspection AssignmentToFunctionParameterJS
    fieldName = getSqlColumnFromProjection(projection);

    if (!isRecursiveCall) {
      const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
      if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
        // noinspection AssignmentToFunctionParameterJS
        fieldValue = encrypt(fieldValue as any, false);
      }
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    if (!isRecursiveCall) {
      const currentEntityOrErrorResponse = await getEntityById(
        dbManager,
        _id ?? id,
        EntityClass,
        undefined,
        true
      );

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
        const subEntityOrEntities = (restOfEntity as any)[fieldName];

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          promises.push(
            forEachAsyncParallel(subEntityOrEntities, async (subEntity: any) => {
              const possibleErrorResponse = await updateEntitiesBy(
                dbManager,
                foreignIdFieldName,
                _id ?? id,
                subEntity,
                (Types as any)[baseTypeName],
                undefined,
                true
              );

              if (possibleErrorResponse) {
                throw possibleErrorResponse;
              }
            })
          );
        } else if (isEntityTypeName(baseTypeName) && subEntityOrEntities !== null) {
          const possibleErrorResponse = await updateEntitiesBy(
            dbManager,
            foreignIdFieldName,
            _id ?? id,
            subEntityOrEntities,
            (Types as any)[baseTypeName],
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
              const deleteStatement = `DELETE FROM ${dbManager.schema}.${EntityClass.name +
                fieldName.slice(0, -1)} WHERE ${idFieldName} = $1`;
              await dbManager.tryExecuteSql(deleteStatement, [_id]);

              const insertStatement = `INSERT INTO ${dbManager.schema}.${EntityClass.name +
                fieldName.slice(0, -1)} (id, ${idFieldName}, ${fieldName.slice(
                0,
                -1
              )}) VALUES(${index}, $1, $2)`;
              await dbManager.tryExecuteSql(insertStatement, [_id, subItem]);
            })
          );
        } else if (fieldName !== '_id' && fieldName !== 'id') {
          if ((restOfEntity as any)[fieldName] !== undefined) {
            columns.push(fieldName);
            if (fieldName === 'version' || fieldName === 'lastModifiedTimestamp') {
              const currentEntityOrErrorResponse = await getEntityById(
                dbManager,
                (restOfEntity as any)._id,
                EntityClass
              );

              if (
                'errorMessage' in currentEntityOrErrorResponse &&
                isErrorResponse(currentEntityOrErrorResponse)
              ) {
                throw currentEntityOrErrorResponse;
              }

              if (fieldName === 'version') {
                values.push((parseInt((currentEntityOrErrorResponse as any).version, 10) + 1).toString());
              } else if (fieldName === 'lastModifiedTimestamp') {
                values.push(new Date());
              }
            } else {
              values.push((restOfEntity as any)[fieldName]);
            }
          }
        }
      }
    );

    const setStatements = columns
      .map((fieldName: string, index: number) => fieldName + ' = ' + `$${index + 2}`)
      .join(', ');

    if (setStatements) {
      promises.push(
        dbManager.tryExecuteSql(
          `UPDATE ${dbManager.schema}.${EntityClass.name} SET ${setStatements} WHERE ${fieldName} = $1`,
          [fieldValue, ...values]
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
