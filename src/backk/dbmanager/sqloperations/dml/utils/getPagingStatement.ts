import assertIsNumber from "../../../../assertions/assertIsNumber";

export default function getPagingStatement(pageNumber?: number, pageSize?: number) {
  let limitAndOffsetStatement = '';

  if (pageNumber && pageSize) {
    assertIsNumber('pageNumber', pageNumber);
    assertIsNumber('pageSize', pageSize);
    limitAndOffsetStatement = `LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`;
  }

  return limitAndOffsetStatement;
}
