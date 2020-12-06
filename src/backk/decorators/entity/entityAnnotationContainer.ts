export interface ManyToManyRelationTableSpec {
  associationTableName: string;
  entityForeignIdFieldName: string;
  subEntityForeignIdFieldName: string;
}

export interface EntityJoinSpec {
  subEntityTableName: string;
  entityIdFieldName: string;
  subEntityForeignIdFieldName: string;
}

class EntityAnnotationContainer {
  readonly entityNameToClassMap: { [key: string]: Function } = {};
  readonly entityNameToAdditionalSqlCreateTableStatementOptionsMap: { [key: string]: string } = {};
  readonly entityNameToForeignIdFieldNamesMap: { [key: string]: string[] } = {};
  readonly entityNameToIndexFieldsMap: { [key: string]: string[] } = {};
  readonly entityNameToUniqueIndexFieldsMap: { [key: string]: string[] } = {};
  readonly indexNameToUsingOptionMap: { [key: string]: string | undefined } = {};
  readonly indexNameToAdditionalSqlCreateIndexStatementOptionsMap: { [key: string]: string | undefined } = {};
  readonly manyToManyRelationTableSpecs: ManyToManyRelationTableSpec[] = [];
  readonly entityNameToJoinsMap: { [key: string]: EntityJoinSpec[] } = {};

  getForeignIdFieldName(entityName: string): string {
    return this.entityNameToForeignIdFieldNamesMap[entityName][0];
  }

  getManyToManyRelationTableSpec(associationTableName: string) {
    return this.manyToManyRelationTableSpecs.find(
      (manyToManyRelationTableSpec) =>
        manyToManyRelationTableSpec.associationTableName === associationTableName
    ) as ManyToManyRelationTableSpec;
  }

  addEntityNameAndClass(entityName: string, entityClass: Function) {
    this.entityNameToClassMap[entityName] = entityClass;
  }

  addAdditionalSqlCreateTableStatementOptionsForEntity(
    entityName: string,
    additionalSqlCreateTableStatementOptions: string
  ) {
    this.entityNameToAdditionalSqlCreateTableStatementOptionsMap[
      entityName
    ] = additionalSqlCreateTableStatementOptions;
  }

  addEntityIndex(entityName: string, indexFields: string[]) {
    this.entityNameToIndexFieldsMap[entityName] = indexFields;
  }

  addEntityUniqueIndex(entityName: string, indexFields: string[]) {
    this.entityNameToUniqueIndexFieldsMap[entityName] = indexFields;
  }

  addUsingOptionForIndex(indexName: string, usingOption?: string) {
    this.indexNameToUsingOptionMap[indexName] = usingOption;
  }

  addAdditionalSqlCreateIndexStatementOptionsForIndex(
    indexName: string,
    additionalSqlCreateIndexStatementOptions?: string
  ) {
    this.indexNameToAdditionalSqlCreateIndexStatementOptionsMap[
      indexName
    ] = additionalSqlCreateIndexStatementOptions;
  }

  addEntityAdditionalPropertyName(entityName: string, propertyName: string) {
    if (this.entityNameToForeignIdFieldNamesMap[entityName]) {
      this.entityNameToForeignIdFieldNamesMap[entityName].push(propertyName);
    } else {
      this.entityNameToForeignIdFieldNamesMap[entityName] = [propertyName];
    }
  }

  addManyToManyRelationTableSpec(manyToManyRelationTableSpec: ManyToManyRelationTableSpec) {
    this.manyToManyRelationTableSpecs.push(manyToManyRelationTableSpec);
  }

  isEntity(Class: Function) {
    let proto = Object.getPrototypeOf(new (Class as new () => any)());
    while (proto !== Object.prototype) {
      if (this.entityNameToClassMap[proto.constructor.name] !== undefined) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }
}

export default new EntityAnnotationContainer();
