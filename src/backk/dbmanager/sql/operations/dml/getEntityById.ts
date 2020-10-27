import getNotFoundErrorResponse from '../../../../errors/getNotFoundErrorResponse';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import tryGetProjection from './utils/tryGetProjection';
import getJoinStatement from './utils/getJoinStatement';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from './utils/transformRowsToObjects';
import getErrorResponse from '../../../../errors/getErrorResponse';
import getTypeMetadata from '../../../../metadata/getTypeMetadata';
import { getBadRequestErrorMessage } from '../../../../errors/getBadRequestErrorResponse';

export default async function getEntityById<T>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  Types: object,
  isInternalCall = false
): Promise<T | ErrorResponse> {
  try {
    const sqlColumns = tryGetProjection(dbManager.schema, {}, entityClass, Types, isInternalCall);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const typeMetadata = getTypeMetadata(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(getBadRequestErrorMessage(idFieldName + ': must be a numeric id'));
    }

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${dbManager.schema}.${entityClass.name}.${idFieldName} = $1`,
      [numericId]
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
    }

    return transformRowsToObjects(result, entityClass, {}, Types)[0];
  } catch (error) {
    return getErrorResponse(error);
  }
}
