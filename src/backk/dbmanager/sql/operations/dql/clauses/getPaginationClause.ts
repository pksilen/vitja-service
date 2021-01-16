import assertIsNumber from "../../../../../assertions/assertIsNumber";

export default function getPaginationClause(pageNumber?: number, pageSize?: number) {
  let limitAndOffsetStatement = '';

  if (pageNumber && pageSize && pageSize !== Number.MAX_SAFE_INTEGER) {
    assertIsNumber('pageNumber', pageNumber);
    assertIsNumber('pageSize', pageSize);
    limitAndOffsetStatement = `LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`;
  }

  return limitAndOffsetStatement;
}
