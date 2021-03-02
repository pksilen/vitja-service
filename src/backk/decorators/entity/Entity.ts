import entityContainer from './entityAnnotationContainer';

export default function Entity(referenceToEntity?: string, additionalSqlCreateTableStatementOptions?: string) {
  return function(EntityClass: Function) {
    entityContainer.addEntityNameAndClass(EntityClass.name, EntityClass);

    if (referenceToEntity) {
      entityContainer.addEntityTableName(EntityClass.name, referenceToEntity);
    }

    if (additionalSqlCreateTableStatementOptions) {
      entityContainer.addAdditionalSqlCreateTableStatementOptionsForEntity(
        EntityClass.name,
        additionalSqlCreateTableStatementOptions
      );
    }
  };
}
