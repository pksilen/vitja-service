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

export default async function updateEntitiesBy<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
  EntityClass: new () => T,
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
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
      throw new Error(createErrorMessageWithStatusCode('Invalid field name: ' + fieldName, 400));
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

    const entityMetadata = getPropertyNameToPropertyTypeNameMap(EntityClass as any);
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
          EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
        const idFieldName = _id === undefined ? 'id' : '_id';

        if (isArrayType && isEntityTypeName(baseTypeName)) {
          promises.push(
            forEachAsyncParallel((restOfItem as any)[fieldName], async (subEntity: any) => {
              const possibleErrorResponse = await updateEntitiesBy(
                dbManager,
                foreignIdFieldName,
                _id ?? restOfItem.id,
                subEntity,
                (Types as any)[baseTypeName],
                true
              );

              if (possibleErrorResponse) {
                throw possibleErrorResponse;
              }
            })
          );
        } else if (isEntityTypeName(baseTypeName)) {
          const possibleErrorResponse = await updateEntitiesBy(
            dbManager,
            foreignIdFieldName,
            _id ?? restOfItem.id,
            (restOfItem as any)[fieldName],
            (Types as any)[baseTypeName],
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

    if (setStatements) {
      promises.push(
        dbManager.tryExecuteSql(
          `UPDATE ${dbManager.schema}.${EntityClass.name} SET ${setStatements} WHERE ${fieldName} = $1`,
          [fieldValue, ...values]
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
