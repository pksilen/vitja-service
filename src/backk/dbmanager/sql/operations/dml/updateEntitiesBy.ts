import isErrorResponse from "../../../../errors/isErrorResponse";
import forEachAsyncSequential from "../../../../utils/forEachAsyncSequential";
import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { RecursivePartial } from "../../../../types/RecursivePartial";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getTypeMetadata from "../../../../metadata/getTypeMetadata";
import { Entity } from "../../../../types/Entity";
import createErrorMessageWithStatusCode from "../../../../errors/createErrorMessageWithStatusCode";
import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import tryGetProjection from "../dql/clauses/tryGetProjection";
import getSqlColumnFromProjection from "../dql/utils/columns/getSqlColumnFromProjection";

export default async function updateEntitiesBy<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T] | string,
  { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
  entityClass: new () => T,
  isRecursiveCall = false
): Promise<void | ErrorResponse> {
  const Types = dbManager.getTypes();
  let didStartTransaction = false;

  try {
    let projection;
    try {
      projection = tryGetProjection(dbManager.schema, { includeResponseFields: [fieldName] }, entityClass, Types);
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
        const foreignIdFieldName =
          entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';
        const idFieldName = _id === undefined ? 'id' : '_id';

        if (fieldTypeName.endsWith('[]')) {
          baseFieldTypeName = fieldTypeName.slice(0, -2);
          isArray = true;
        }

        if (
          isArray &&
          baseFieldTypeName !== 'Date' &&
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          promises.push(
            forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
              const possibleErrorResponse = await updateEntitiesBy(
                dbManager,
                foreignIdFieldName,
                _id ?? restOfItem.id,
                subItem,
                (Types as any)[baseFieldTypeName],
                true
              );

              if (possibleErrorResponse) {
                throw possibleErrorResponse;
              }
            })
          );
        } else if (
          baseFieldTypeName !== 'Date' &&
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          const possibleErrorResponse = await updateEntitiesBy(
            dbManager,
            foreignIdFieldName,
            _id ?? restOfItem.id,
            (restOfItem as any)[fieldName],
            (Types as any)[baseFieldTypeName],
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

    if (setStatements) {
      promises.push(
        dbManager.tryExecuteSql(
          `UPDATE ${dbManager.schema}.${entityClass.name} SET ${setStatements} WHERE ${fieldName} = $1`,
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
