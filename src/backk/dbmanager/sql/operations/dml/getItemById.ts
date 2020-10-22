import getBadRequestErrorResponse from '../../../../errors/getBadRequestErrorResponse';
import { getTypeMetadata } from '../../../../service/generateServicesMetadata';
import getNotFoundErrorResponse from '../../../../errors/getNotFoundErrorResponse';
import joinjs from 'join-js';
import decryptItems from '../../../../crypt/decryptItems';
import getInternalServerErrorResponse from '../../../../errors/getInternalServerErrorResponse';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import tryGetProjection from './utils/tryGetProjection';
import getJoinStatement from './utils/getJoinStatement';
import createResultMaps from './utils/createResultMaps';
import transformResults from './utils/transformResults';
import { ErrorResponse } from "../../../../types/ErrorResponse";

export default async function getItemById<T>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  Types: object
): Promise<T | ErrorResponse> {
  try {
    let sqlColumns;
    try {
      sqlColumns = tryGetProjection(dbManager.schema, {}, entityClass, Types);
    } catch (error) {
      return getBadRequestErrorResponse(error.message);
    }
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const typeMetadata = getTypeMetadata(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${dbManager.schema}.${entityClass.name}.${idFieldName} = $1`,
      [parseInt(_id, 10)]
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
    }

    const resultMaps = createResultMaps(entityClass, Types, {});
    const rows = joinjs.map(
      result.rows,
      resultMaps,
      entityClass.name + 'Map',
      entityClass.name.toLowerCase() + '_'
    );
    transformResults(rows, entityClass, Types);
    decryptItems(rows, entityClass, Types);
    return rows[0];
  } catch (error) {
    return getInternalServerErrorResponse(error);
  }
}
