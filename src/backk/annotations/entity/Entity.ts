import entityContainer from './entityAnnotationContainer';

export default function Entity(additionalSqlCreateTableStatementOptions?: string) {
  return function(entityClass: Function) {
    entityContainer.addEntityNameAndClass(entityClass.name, entityClass);

    if (additionalSqlCreateTableStatementOptions) {
      entityContainer.addAdditionalSqlCreateTableStatementOptionsForEntity(
        entityClass.name,
        additionalSqlCreateTableStatementOptions
      );
    }
  };
}
