import AbstractDbManager from '../../../AbstractDbManager';
import tryCreateIndex from './tryCreateIndex';

export default async function tryCreateUniqueIndex(
  dbManager: AbstractDbManager,
  entityName: string,
  schema: string | undefined,
  indexFields: string[]
) {
  await tryCreateIndex(dbManager, entityName, schema, indexFields, true);
}
