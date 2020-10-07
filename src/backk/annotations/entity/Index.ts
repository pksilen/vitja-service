import entityContainer from './entityAnnotationContainer';

export default function Index(
  indexFields: string[],
  usingOption?: string,
  additionalSqlCreateIndexStatementOptions?: string
) {
  return function(entityClass: Function) {
    entityContainer.addEntityIndex(entityClass.name, indexFields);
    entityContainer.addUsingOptionForIndex(entityClass.name + indexFields.join(''), usingOption);
    entityContainer.addAdditionalSqlCreateIndexStatementOptionsForIndex(
      entityClass.name + indexFields.join(''),
      additionalSqlCreateIndexStatementOptions
    );
  };
}
