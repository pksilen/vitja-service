import entityContainer from './entityAnnotationContainer';

export default function Entity(tableName?: string, additionalSqlCreateTableStatementOptions?: string) {
  return function(entityClass: Function) {
    entityContainer.addEntityNameAndClass(entityClass.name, entityClass);

    if (tableName) {
      entityContainer.addEntityTableName(entityClass.name, tableName);
    }

    if (additionalSqlCreateTableStatementOptions) {
      entityContainer.addAdditionalSqlCreateTableStatementOptionsForEntity(
        entityClass.name,
        additionalSqlCreateTableStatementOptions
      );
    }
  };
}
