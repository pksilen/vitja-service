import { types } from 'pg';
import getBadRequestErrorResponse from '../../../../errors/getBadRequestErrorResponse';
import getNotFoundErrorResponse from '../../../../errors/getNotFoundErrorResponse';
import joinjs from 'join-js';
import decryptItems from '../../../../crypt/decryptItems';
import getInternalServerErrorResponse from '../../../../errors/getInternalServerErrorResponse';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import tryGetProjection from './utils/tryGetProjection';
import tryGetSortStatement from './utils/tryGetSortStatement';
import getJoinStatement from './utils/getJoinStatement';
import getPagingStatement from './utils/getPagingStatement';
import createResultMaps from './utils/createResultMaps';
import transformResults from './utils/transformResults';
import OptPostQueryOps from '../../../../types/OptPostQueryOps';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import transformRowsToObjects from "./utils/transformRowsToObjects";
import getErrorResponse from "../../../../errors/getErrorResponse";

export default async function getItemsByIds<T>(
  dbManager: PostgreSqlDbManager,
  _ids: string[],
  entityClass: new () => T,
  Types: object,
  postQueryOps?: OptPostQueryOps
): Promise<T[] | ErrorResponse> {
  try {
    const projection = {
      includeResponseFields: postQueryOps?.includeResponseFields,
      excludeResponseFields: postQueryOps?.excludeResponseFields
    };

    const sqlColumns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
    const sortStatement = tryGetSortStatement(dbManager.schema, postQueryOps?.sortBys, entityClass, types);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(postQueryOps?.pageNumber, postQueryOps?.pageSize);
    const numericIds = _ids.map((id) => parseInt(id, 10));
    const idPlaceholders = _ids.map((_, index) => `$${index + 1}`).join(', ');

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE _id IN (${idPlaceholders}) ${sortStatement} ${pagingStatement}`,
      numericIds
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item with _ids: ${_ids} not found`);
    }

    return transformRowsToObjects(result, entityClass, projection, Types);
  } catch (error) {
    return getErrorResponse(error);
  }
}
