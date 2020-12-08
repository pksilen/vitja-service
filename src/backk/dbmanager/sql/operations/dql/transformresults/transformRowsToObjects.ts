import { QueryResult } from "pg";
import joinjs from "join-js";
import transformResults from "./transformResults";
import decryptItems from "../../../../../crypt/decryptItems";
import createResultMaps from "./createResultMaps";
import removeSingleSubEntitiesWithNullProperties from "./removeSingleSubEntitiesWithNullProperties";
import { PostQueryOperations } from "../../../../../types/postqueryoperations/PostQueryOperations";

export default function transformRowsToObjects<T>(
  result: QueryResult<any>,
  EntityClass: { new (): T },
  { pageSize, includeResponseFields, excludeResponseFields }: PostQueryOperations,
  Types: object
) {
  const resultMaps = createResultMaps(EntityClass, Types, { includeResponseFields, excludeResponseFields });

  let rows = joinjs.map(
    result.rows,
    resultMaps,
    EntityClass.name + 'Map',
    EntityClass.name.toLowerCase() + '_'
  );

  if (rows.length > pageSize) {
    rows = rows.slice(0, pageSize);
  }

  transformResults(rows, EntityClass, Types);
  decryptItems(rows, EntityClass, Types);
  removeSingleSubEntitiesWithNullProperties(rows);
  return rows;
}
