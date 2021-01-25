import entityContainer from './entityAnnotationContainer';

export default function Entity(referenceToEntity?: string, additionalSqlCreateTableStatementOptions?: string) {
  return function(entityClass: Function) {
    entityContainer.addEntityNameAndClass(entityClass.name, entityClass);

    if (referenceToEntity) {
      entityContainer.addEntityTableName(entityClass.name, referenceToEntity);
    }

    if (additionalSqlCreateTableStatementOptions) {
      entityContainer.addAdditionalSqlCreateTableStatementOptionsForEntity(
        entityClass.name,
        additionalSqlCreateTableStatementOptions
      );
    }
  };
}
