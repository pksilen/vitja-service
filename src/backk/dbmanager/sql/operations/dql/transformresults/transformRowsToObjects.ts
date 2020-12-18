import joinjs from 'join-js';
import transformResults from './transformResults';
import decryptItems from '../../../../../crypt/decryptItems';
import createResultMaps from './createResultMaps';
import removeSingleSubEntitiesWithNullProperties from './removeSingleSubEntitiesWithNullProperties';
import { PostQueryOperations } from '../../../../../types/postqueryoperations/PostQueryOperations';

const ROW_BATCH_SIZE = 500;

function getMappedRows(
  rows: any[],
  resultMaps: any[],
  EntityClass: new () => any,
  Types: object,
  startIndex?: number,
  endIndex?: number
) {
  const mappedRows = joinjs.map(
    startIndex && endIndex ? rows.slice(startIndex, endIndex < rows.length ? endIndex : undefined) : rows,
    resultMaps,
    EntityClass.name + 'Map',
    EntityClass.name.toLowerCase() + '_'
  );

  transformResults(mappedRows, EntityClass, Types);
  decryptItems(mappedRows, EntityClass, Types);
  removeSingleSubEntitiesWithNullProperties(mappedRows);
  return mappedRows;
}

export default function transformRowsToObjects<T>(
  rows: any[],
  EntityClass: { new (): T },
  { pageSize, includeResponseFields, excludeResponseFields }: PostQueryOperations,
  Types: object
) {
  const resultMaps = createResultMaps(EntityClass, Types, { includeResponseFields, excludeResponseFields });
  let mappedRows: any[] = [];
  if (rows.length > ROW_BATCH_SIZE) {
    Array(Math.round(rows.length / ROW_BATCH_SIZE))
      .fill(1)
      .forEach((rowBatch, index) => {
        setImmediate(() => {
          mappedRows = mappedRows.concat(
            getMappedRows(
              rows,
              resultMaps,
              EntityClass,
              Types,
              index * ROW_BATCH_SIZE,
              (index + 1) * ROW_BATCH_SIZE
            )
          );
        });
      });
  } else {
    mappedRows = getMappedRows(rows, resultMaps, EntityClass, Types);
  }

  if (mappedRows.length > pageSize) {
    mappedRows = mappedRows.slice(0, pageSize);
  }

  return mappedRows;
}
