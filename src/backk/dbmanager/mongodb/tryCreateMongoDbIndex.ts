import MongoDbManager from '../MongoDbManager';

export default async function tryCreateMongoDbIndex(
  dbManager: MongoDbManager,
  indexName: string,
  schema: string | undefined,
  indexFields: string[],
  isUnique = false
) {
  const collectionName = indexName.split(':')[0].toLowerCase();
  await dbManager.tryReserveDbConnectionFromPool();
  await dbManager.tryExecute(false, async (client) => {
    client
      .db(dbManager.dbName)
      .collection(collectionName)
      .createIndex(
        indexFields.reduce((indexFieldsSpec, indexField) => ({ ...indexFieldsSpec, [indexField]: 1 }), {}),
        {
          unique: isUnique
        }
      );
  });
}
