import entityAnnotationContainer from "../entity/entityAnnotationContainer";

export default function Index(usingOption?: string, additionalSqlCreateIndexStatementOptions?: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, propertyName: string) {
    entityAnnotationContainer.addEntityIndex(object.constructor.name + ':' + propertyName, [propertyName]);
    entityAnnotationContainer.addUsingOptionForIndex(
      object.constructor.name + ':' + propertyName,
      usingOption
    );
    entityAnnotationContainer.addAdditionalSqlCreateIndexStatementOptionsForIndex(
      object.constructor.name + ':' + propertyName,
      additionalSqlCreateIndexStatementOptions
    );
  };
}
