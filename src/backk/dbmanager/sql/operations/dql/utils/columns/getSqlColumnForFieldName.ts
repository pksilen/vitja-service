import tryGetProjection from '../../clauses/tryGetProjection';
import createErrorMessageWithStatusCode from '../../../../../../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../../../../../../constants/constants';
import getSqlColumnFromProjection from './getSqlColumnFromProjection';
import AbstractSqlDbManager from "../../../../../AbstractSqlDbManager";

export default function tryGetSqlColumnForFieldName(
  fieldName: string,
  dbManager: AbstractSqlDbManager,
  entityClass: Function,
  Types: object
): string {
  let projection;
  try {
    projection = tryGetProjection(dbManager, { includeResponseFields: [fieldName] }, entityClass, Types);
  } catch (error) {
    throw new Error(
      createErrorMessageWithStatusCode(
        'Invalid sub pagination field: ' + fieldName,
        HttpStatusCodes.BAD_REQUEST
      )
    );
  }

  return getSqlColumnFromProjection(projection);
}
