import { QueryResult } from 'pg';
import joinjs from 'join-js';
import transformResults from './transformResults';
import decryptItems from '../../../../../crypt/decryptItems';
import createResultMaps from "./createResultMaps";
import { Projection } from "../../../../../types/postqueryoperations/Projection";
import removeSingleSubEntitiesWithNullProperties from "./removeSingleSubEntitiesWithNullProperties";

export default function transformRowsToObjects<T>(
  result: QueryResult<any>,
  entityClass: { new (): T },
  projection: Projection,
  pageSize: number,
  Types: object
) {
  const resultMaps = createResultMaps(entityClass, Types, projection);

  let rows = joinjs.map(
    result.rows,
    resultMaps,
    entityClass.name + 'Map',
    entityClass.name.toLowerCase() + '_'
  );

  if (rows.length > pageSize) {
    rows = rows.slice(0, pageSize);
  }

  transformResults(rows, entityClass, Types);
  decryptItems(rows, entityClass, Types);
  removeSingleSubEntitiesWithNullProperties(rows);
  return rows;
}
