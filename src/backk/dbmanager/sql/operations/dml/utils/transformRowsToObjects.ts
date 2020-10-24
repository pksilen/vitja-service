import { QueryResult } from 'pg';
import joinjs from 'join-js';
import transformResults from './transformResults';
import decryptItems from '../../../../../crypt/decryptItems';
import createResultMaps from "./createResultMaps";
import { OptionalProjection } from "../../../../../types/OptionalProjection";

export default function transformRowsToObjects<T>(
  result: QueryResult<any>,
  entityClass: { new (): T },
  projection: OptionalProjection,
  Types: object
) {
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
}
