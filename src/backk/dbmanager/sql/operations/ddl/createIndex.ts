import AbstractDbManager from '../../../AbstractDbManager';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';

export default async function createIndex(
  dbManager: AbstractDbManager,
  entityName: string,
  schema: string | undefined,
  indexFields: string[],
  isUnique = false
) {
  const indexName = entityName + indexFields.join('');
  const indexUsingOption = entityAnnotationContainer.indexNameToUsingOptionMap[indexName];
  const additionalSqlCreateIndexStatementOptions =
    entityAnnotationContainer.indexNameToAdditionalSqlCreateIndexStatementOptionsMap[indexName];

  const createIndexStatement = `CREATE ${
    isUnique ? 'UNIQUE' : ''
  } INDEX IF NOT EXISTS ${entityName}_${indexFields.join('_')} ON ${schema}.${entityName} ${
    indexUsingOption ? 'USING ' + indexUsingOption : ''
  } (${indexFields.join(', ')}) ${additionalSqlCreateIndexStatementOptions ?? ''}`;

  await dbManager.tryExecuteSqlWithoutCls(createIndexStatement);
}
