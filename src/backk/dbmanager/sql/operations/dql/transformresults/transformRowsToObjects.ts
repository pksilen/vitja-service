import joinjs from "join-js";
import transformResults from "./transformResults";
import decryptItems from "../../../../../crypt/decryptItems";
import createResultMaps from "./createResultMaps";
import removeSingleSubEntitiesWithNullProperties from "./removeSingleSubEntitiesWithNullProperties";
import { PostQueryOperations } from "../../../../../types/postqueryoperations/PostQueryOperations";

export default function transformRowsToObjects<T>(
  rows: any[],
  EntityClass: { new (): T },
  { pageSize, includeResponseFields, excludeResponseFields }: PostQueryOperations,
  Types: object
) {
  const resultMaps = createResultMaps(EntityClass, Types, { includeResponseFields, excludeResponseFields });

  let mappedRows = joinjs.map(
    rows,
    resultMaps,
    EntityClass.name + 'Map',
    EntityClass.name.toLowerCase() + '_'
  );


  if (rows.length > pageSize) {
    mappedRows = mappedRows.slice(0, pageSize);
  }

  transformResults(mappedRows, EntityClass, Types);
  decryptItems(mappedRows, EntityClass, Types);
  removeSingleSubEntitiesWithNullProperties(mappedRows);
  return mappedRows;
}
