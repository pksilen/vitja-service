export interface ManyToManyRelationTableSpec {
  tableName: string;
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
  readonly entityNameToAdditionalIdPropertyNamesMap: { [key: string]: string[] } = {};
  readonly entityNameToIndexFieldsMap: { [key: string]: string[] } = {};
  readonly entityNameToUniqueIndexFieldsMap: { [key: string]: string[] } = {};
  readonly indexNameToUsingOptionMap: { [key: string]: string | undefined } = {};
  readonly indexNameToAdditionalSqlCreateIndexStatementOptionsMap: { [key: string]: string | undefined } = {};
  readonly manyToManyRelationTableSpecs: ManyToManyRelationTableSpec[] = [];
  readonly entityNameToJoinsMap: { [key: string]: EntityJoinSpec[] } = {};

  getAdditionIdPropertyName(entityName: string): string {
    return this.entityNameToAdditionalIdPropertyNamesMap[entityName][0];
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
    if (this.entityNameToAdditionalIdPropertyNamesMap[entityName]) {
      this.entityNameToAdditionalIdPropertyNamesMap[entityName].push(propertyName);
    } else {
      this.entityNameToAdditionalIdPropertyNamesMap[entityName] = [propertyName];
    }
  }

  addManyToManyRelationTableSpec(manyToManyRelationTableSpec: ManyToManyRelationTableSpec) {
    this.manyToManyRelationTableSpecs.push(manyToManyRelationTableSpec);
  }
}

export default new EntityAnnotationContainer();
