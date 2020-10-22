import shouldUseRandomInitializationVector from '../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../crypt/shouldEncryptValue';
import encrypt from '../../../crypt/encrypt';
import getBadRequestErrorResponse from '../../../getBadRequestErrorResponse';
import getNotFoundErrorResponse from '../../../getNotFoundErrorResponse';
import joinjs from 'join-js';
import decryptItems from '../../../crypt/decryptItems';
import getInternalServerErrorResponse from '../../../getInternalServerErrorResponse';
import PostgreSqlDbManager from "../../PostgreSqlDbManager";
import tryGetProjection from "./utils/tryGetProjection";
import tryGetSortStatement from "./utils/tryGetSortStatement";
import getJoinStatement from "./utils/getJoinStatement";
import getPagingStatement from "./utils/getPagingStatement";
import createResultMaps from "./utils/createResultMaps";
import transformResults from "./utils/transformResults";
import OptPostQueryOps from "../../../types/OptPostQueryOps";
import { ErrorResponse } from "../../../types/ErrorResponse";

export default async function getItemsBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  Types: object,
  postQueryOps?: OptPostQueryOps
): Promise<T[] | ErrorResponse> {
  try {
    const item = {
      [fieldName]: fieldValue
    };

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    const projection = {
      includeResponseFields: postQueryOps?.includeResponseFields,
      excludeResponseFields: postQueryOps?.excludeResponseFields
    };

    let sqlColumns;
    let sortStatement;
    try {
      sqlColumns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
      sortStatement = tryGetSortStatement(dbManager.schema, postQueryOps?.sortBys, entityClass, Types);
    } catch (error) {
      return getBadRequestErrorResponse(error.message);
    }

    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(
      postQueryOps?.pageNumber,
      postQueryOps?.pageSize
    );

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1 ${sortStatement} ${pagingStatement}`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item(s) with ${fieldName}: ${fieldValue} not found`);
    }

    const resultMaps = createResultMaps(entityClass, Types, projection);
    const rows = joinjs.map(
      result.rows,
      resultMaps,
      entityClass.name + 'Map',
      entityClass.name.toLowerCase() + '_'
    );
    transformResults(rows, entityClass, Types);
    decryptItems(rows, entityClass, Types);
    return rows;
  } catch (error) {
    return getInternalServerErrorResponse(error);
  }
}
