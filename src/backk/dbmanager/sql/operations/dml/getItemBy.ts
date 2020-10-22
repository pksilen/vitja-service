import shouldUseRandomInitializationVector from '../../../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../../../crypt/shouldEncryptValue';
import encrypt from '../../../../crypt/encrypt';
import getBadRequestErrorResponse from '../../../../errors/getBadRequestErrorResponse';
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

export default async function getItemBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  Types: object
): Promise<T | ErrorResponse> {
  try {
    const item = {
      [fieldName]: fieldValue
    };

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    let sqlColumns;
    try {
      sqlColumns = tryGetProjection(dbManager.schema, {}, entityClass, Types);
    } catch (error) {
      return getBadRequestErrorResponse(error.message);
    }

    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item with ${fieldName}: ${fieldValue} not found`);
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
