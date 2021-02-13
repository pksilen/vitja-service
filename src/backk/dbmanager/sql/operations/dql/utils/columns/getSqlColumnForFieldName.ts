import tryGetProjection from '../../clauses/tryGetProjection';
import createErrorMessageWithStatusCode from '../../../../../../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../../../../../../constants/constants';
import getSqlColumnFromProjection from './getSqlColumnFromProjection';
import AbstractSqlDbManager from "../../../../../AbstractSqlDbManager";
import createErrorFromErrorCodeMessageAndStatus
  from "../../../../../../errors/createErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS_INVALID_ARGUMENT } from "../../../../../../errors/backkErrors";

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
    throw createErrorFromErrorCodeMessageAndStatus({
      ...BACKK_ERRORS_INVALID_ARGUMENT,
      errorMessage: BACKK_ERRORS_INVALID_ARGUMENT + 'invalid sub pagination field: ' + fieldName
    });
  }

  return getSqlColumnFromProjection(projection);
}
