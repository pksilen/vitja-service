import AbstractDbManager from '../../../AbstractDbManager';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';

export default async function tryCreateIndex(
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

  try {
    const createIndexStatement = `CREATE ${
      isUnique ? 'UNIQUE' : ''
    } INDEX ${entityName}_${indexFields.join('_')} ON ${schema}.${entityName} ${
      indexUsingOption ? 'USING ' + indexUsingOption : ''
    }(${indexFields.join(', ')}) ${additionalSqlCreateIndexStatementOptions ?? ''}`;

    await dbManager.tryExecuteSqlWithoutCls(createIndexStatement, undefined, false);
  } catch(error) {
    // NOOP
  }
}
