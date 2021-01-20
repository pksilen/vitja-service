import assertIsNumber from "../../../../../assertions/assertIsNumber";
import Pagination from "../../../../../types/postqueryoperations/Pagination";
import createErrorMessageWithStatusCode from "../../../../../errors/createErrorMessageWithStatusCode";
import { HttpStatusCodes } from "../../../../../constants/constants";

export default function getPaginationClause(subEntityPath: string, paginations: Pagination[]) {
  let limitAndOffsetStatement = '';

  let pagination = paginations.find(
    (pagination) =>
      pagination.subEntityPath === subEntityPath || (subEntityPath === '' && !pagination.subEntityPath)
  );

  if (!pagination) {
    pagination = paginations.find((pagination) => pagination.subEntityPath === '*');
  }

  if (!pagination && subEntityPath === '') {
    throw new Error(
      createErrorMessageWithStatusCode(
        "Missing pagination for root entity (subEntityPath: '')",
        HttpStatusCodes.BAD_REQUEST
      )
    );
  }

  if (pagination && pagination.pageSize !== Number.MAX_SAFE_INTEGER) {
    assertIsNumber('pageNumber', pagination.pageNumber);
    assertIsNumber('pageSize', pagination.pageSize);
    limitAndOffsetStatement = `LIMIT ${pagination.pageSize} OFFSET ${(pagination.pageNumber - 1) *
      pagination.pageSize}`;
  }

  return limitAndOffsetStatement;
}
