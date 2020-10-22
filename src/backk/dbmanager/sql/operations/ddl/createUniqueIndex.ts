import AbstractDbManager from '../../../AbstractDbManager';
import createIndex from './createIndex';

export default async function createUniqueIndex(
  dbManager: AbstractDbManager,
  entityName: string,
  schema: string | undefined,
  indexFields: string[]
) {
  await createIndex(dbManager, entityName, schema, indexFields, true);
}
