import isErrorResponse from "../../../../errors/isErrorResponse";
import forEachAsyncSequential from "../../../../utils/forEachAsyncSequential";
import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { RecursivePartial } from "../../../../types/RecursivePartial";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getPropertyNameToPropertyTypeNameMap from "../../../../metadata/getPropertyNameToPropertyTypeNameMap";
import { Entity } from "../../../../types/Entity";
import createErrorMessageWithStatusCode from "../../../../errors/createErrorMessageWithStatusCode";
import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import tryGetProjection from "../dql/clauses/tryGetProjection";
import getSqlColumnFromProjection from "../dql/utils/columns/getSqlColumnFromProjection";
import getTypeInfoForTypeName from "../../../../utils/type/getTypeInfoForTypeName";
import isEntityTypeName from "../../../../utils/type/isEntityTypeName";
import tryStartLocalTransactionIfNeeded from "../transaction/tryStartLocalTransactionIfNeeded";
import tryCommitLocalTransactionIfNeeded from "../transaction/tryCommitLocalTransactionIfNeeded";
import tryRollbackLocalTransactionIfNeeded from "../transaction/tryRollbackLocalTransactionIfNeeded";
import cleanupLocalTransactionIfNeeded from "../transaction/cleanupLocalTransactionIfNeeded";
import { HttpStatusCodes } from "../../../../constants/constants";
import { PreHook } from "../../../hooks/PreHook";
import tryExecutePreHooks from "../../../hooks/tryExecutePreHooks";
import getEntityBy from "../dql/getEntityBy";

export default async function updateEntityBy<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  entity: RecursivePartial<T>,
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

    const finalFieldName = getSqlColumnFromProjection(projection);

    let finalFieldValue = fieldValue;
    if (!isRecursiveCall) {
      const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
      if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
        // noinspection AssignmentToFunctionParameterJS
        finalFieldValue = encrypt(fieldValue as any, false);
      }
    }

    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    let currentEntityOrErrorResponse: any;
    if (!isRecursiveCall) {
      currentEntityOrErrorResponse = await getEntityBy(dbManager, fieldName, fieldValue as any, EntityClass);

      await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    }
    const entityMetadata = getPropertyNameToPropertyTypeNameMap(EntityClass as any);
    const columns: any = [];
    const values: any = [];
    const promises: Array<Promise<any>> = [];

    await forEachAsyncSequential(
      Object.entries(entityMetadata),
      async ([fieldName, fieldTypeName]: [any, any]) => {
        if (currentEntityOrErrorResponse[fieldName] === undefined) {
          return;
        }

        const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
        const foreignIdFieldName =
          EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
        const idFieldName = currentEntityOrErrorResponse._id === undefined ? 'id' : '_id';
        const subEntityOrEntities = currentEntityOrErrorResponse[fieldName];

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          promises.push(
            forEachAsyncParallel(subEntityOrEntities, async (subEntity: any) => {
              const possibleErrorResponse = await updateEntityBy(
                dbManager,
                foreignIdFieldName,
                currentEntityOrErrorResponse._id ?? currentEntityOrErrorResponse.id,
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
          const possibleErrorResponse = await updateEntityBy(
            dbManager,
            foreignIdFieldName,
            currentEntityOrErrorResponse._id ?? currentEntityOrErrorResponse.id,
            subEntityOrEntities,
            (Types as any)[baseTypeName],
            undefined,
            true
          );

          if (possibleErrorResponse) {
            throw possibleErrorResponse;
          }
        } else if (isArrayType) {
          const numericId = parseInt(currentEntityOrErrorResponse._id, 10);
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
            forEachAsyncParallel(currentEntityOrErrorResponse[fieldName], async (subItem: any, index) => {
              const deleteStatement = `DELETE FROM ${dbManager.schema}.${EntityClass.name +
                fieldName.slice(0, -1)} WHERE ${idFieldName} = $1`;
              await dbManager.tryExecuteSql(deleteStatement, [currentEntityOrErrorResponse._id]);

              const insertStatement = `INSERT INTO ${dbManager.schema}.${EntityClass.name +
                fieldName.slice(0, -1)} (id, ${idFieldName}, ${fieldName.slice(
                0,
                -1
              )}) VALUES(${index}, $1, $2)`;
              await dbManager.tryExecuteSql(insertStatement, [currentEntityOrErrorResponse._id, subItem]);
            })
          );
        } else if (fieldName !== '_id' && fieldName !== 'id') {
          if (currentEntityOrErrorResponse[fieldName] !== undefined) {
            columns.push(fieldName);
            if (fieldName === 'version' || fieldName === 'lastModifiedTimestamp') {
              if (fieldName === 'version') {
                values.push((parseInt(currentEntityOrErrorResponse.version, 10) + 1).toString());
              } else if (fieldName === 'lastModifiedTimestamp') {
                values.push(new Date());
              }
            } else {
              values.push(currentEntityOrErrorResponse[fieldName]);
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
          `UPDATE ${dbManager.schema}.${EntityClass.name} SET ${setStatements} WHERE ${finalFieldName} = $1`,
          [finalFieldValue, ...values]
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
