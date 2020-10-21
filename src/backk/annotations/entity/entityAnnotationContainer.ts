import AbstractDbManager from '../../dbmanager/AbstractDbManager';
import forEachAsyncParallel from '../../forEachAsyncParallel';
import forEachAsyncSequential from '../../forEachAsyncSequential';
import { getTypeMetadata } from '../../generateServicesMetadata';
import typeAnnotationContainer from '../typeproperty/typePropertyAnnotationContainer';

export interface ManyToManyRelationTableSpec {
  tableName: string;
  id1Name: string;
  id2Name: string;
}

export interface JoinSpec {
  joinTableName: string;
  fieldName: string;
  joinTableFieldName: string;
}

class EntityAnnotationContainer {
  private entityNameToClassMap: { [key: string]: Function } = {};
  private entityNameToAdditionalSqlCreateTableStatementOptionsMap: { [key: string]: string } = {};
  private entityNameToAdditionalIdPropertyNamesMap: { [key: string]: string[] } = {};
  private entityNameToIndexFieldsMap: { [key: string]: string[] } = {};
  private entityNameToUniqueIndexFieldsMap: { [key: string]: string[] } = {};
  private indexNameToUsingOptionMap: { [key: string]: string | undefined } = {};
  private indexNameToAdditionalSqlCreateIndexStatementOptionsMap: { [key: string]: string | undefined } = {};
  private manyToManyRelationTableSpecs: ManyToManyRelationTableSpec[] = [];
  entityNameToJoinsMap: { [key: string]: JoinSpec[] } = {};

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

  async createTablesAndIndexes(dbManager: AbstractDbManager) {
    await forEachAsyncParallel(
      Object.entries(this.entityNameToClassMap),
      async ([entityName, entityClass]: [any, any]) => {
        try {
          await this.createTable(dbManager, entityName, entityClass, dbManager.schema);
        } catch (error) {
          console.log(error);
        }
      }
    );

    await forEachAsyncParallel(
      Object.entries(this.entityNameToIndexFieldsMap),
      async ([entityName, indexFields]: [any, any]) => {
        try {
          await this.createIndex(dbManager, entityName, dbManager.schema, indexFields);
        } catch (error) {
          console.log(error);
        }
      }
    );

    await forEachAsyncParallel(
      Object.entries(this.entityNameToUniqueIndexFieldsMap),
      async ([entityName, indexFields]: [any, any]) => {
        try {
          await this.createUniqueIndex(dbManager, entityName, dbManager.schema, indexFields);
        } catch (error) {
          console.log(error);
        }
      }
    );

    await forEachAsyncSequential(
      Object.entries(this.entityNameToAdditionalIdPropertyNamesMap),
      async ([entityName, additionalPropertyNames]: [any, any]) => {
        try {
          const fields = await dbManager.tryExecuteSqlWithoutCls(
            `SELECT * FROM ${dbManager.schema}.${entityName} LIMIT 1`
          );

          await forEachAsyncParallel(additionalPropertyNames, async (additionalPropertyName: any) => {
            if (!fields.find((field) => field.name.toLowerCase() === additionalPropertyName.toLowerCase())) {
              let alterTableStatement = `ALTER TABLE ${dbManager.schema}.${entityName} ADD `;
              alterTableStatement += additionalPropertyName + ' BIGINT';
              await dbManager.tryExecuteSqlWithoutCls(alterTableStatement);
            }
          });
        } catch (error) {
          console.log(error);
        }
      }
    );
  }

  private async createTable(
    dbManager: AbstractDbManager,
    entityName: string,
    entityClass: Function,
    schema: string | undefined
  ) {
    try {
      const fields = await dbManager.tryExecuteSqlWithoutCls(`SELECT * FROM ${schema}.${entityName} LIMIT 1`);
      const entityMetadata = getTypeMetadata(entityClass as any);

      await forEachAsyncParallel(
        Object.entries(entityMetadata),
        async ([fieldName, fieldTypeName]: [any, any]) => {
          if (!fields.find((field) => field.name.toLowerCase() === fieldName.toLowerCase())) {
            let alterTableStatement = `ALTER TABLE ${schema}.${entityName} ADD `;
            let baseFieldTypeName = fieldTypeName;
            let isArray = false;
            let sqlColumnType: string = '';

            if (fieldTypeName.endsWith('[]')) {
              baseFieldTypeName = fieldTypeName.slice(0, -2);
              isArray = true;
            }

            switch (baseFieldTypeName) {
              case 'integer':
                sqlColumnType = 'INTEGER';
                break;
              case 'bigint':
                sqlColumnType = 'BIGINT';
                break;
              case 'number':
                sqlColumnType = 'DOUBLE PRECISION';
                break;
              case 'boolean':
                sqlColumnType = 'BOOLEAN';
                break;
              case 'string':
                if (fieldName.endsWith('Id') || fieldName === 'id') {
                  sqlColumnType = 'BIGINT';
                } else {
                  sqlColumnType = 'VARCHAR';
                }
                break;
            }

            if (!sqlColumnType && baseFieldTypeName[0] === '(') {
              const enumValues = baseFieldTypeName.slice(1).split(/[|)]/);
              const firstEnumValue = enumValues[0];

              if (firstEnumValue[0] === "'") {
                sqlColumnType = 'VARCHAR';
              } else {
                const hasFloat = enumValues.reduce(
                  (hasFloat: boolean, enumValue: string) =>
                    hasFloat || parseInt(enumValue, 10).toString().length !== enumValue.length,
                  false
                );
                if (hasFloat) {
                  sqlColumnType = 'DOUBLE PRECISION';
                } else {
                  sqlColumnType = 'INTEGER';
                }
              }
            }

            if (
              isArray &&
              baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
              baseFieldTypeName[0] !== '('
            ) {
              const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
              const relationEntityName = baseFieldTypeName;
              if (this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName]) {
                this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName].push(idFieldName);
              } else {
                this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName] = [idFieldName];
              }
              const joinSpec = {
                joinTableName: relationEntityName,
                fieldName: '_id',
                joinTableFieldName: idFieldName
              };
              if (this.entityNameToJoinsMap[entityName]) {
                this.entityNameToJoinsMap[entityName].push(joinSpec);
              } else {
                this.entityNameToJoinsMap[entityName] = [joinSpec];
              }
            } else if (
              baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
              baseFieldTypeName[0] !== '('
            ) {
              const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
              const relationEntityName = baseFieldTypeName;
              if (this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName]) {
                this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName].push(idFieldName);
              } else {
                this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName] = [idFieldName];
              }
              const joinSpec = {
                joinTableName: relationEntityName,
                fieldName: '_id',
                joinTableFieldName: idFieldName
              };
              if (this.entityNameToJoinsMap[entityName]) {
                this.entityNameToJoinsMap[entityName].push(joinSpec);
              } else {
                this.entityNameToJoinsMap[entityName] = [joinSpec];
              }
            } else if (isArray) {
              let createAdditionalTableStatement = `CREATE TABLE IF NOT EXISTS ${schema}.${entityName +
                fieldName.slice(0, -1)} (`;
              const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
              createAdditionalTableStatement +=
                'id BIGINT, ' +
                idFieldName +
                ' BIGINT, ' +
                fieldName.slice(0, -1) +
                ' ' +
                sqlColumnType +
                ')';
              await dbManager.tryExecuteSqlWithoutCls(createAdditionalTableStatement);

              const joinSpec = {
                joinTableName: entityName + fieldName.slice(0, -1),
                fieldName: '_id',
                joinTableFieldName: idFieldName
              };
              if (this.entityNameToJoinsMap[entityName]) {
                this.entityNameToJoinsMap[entityName].push(joinSpec);
              } else {
                this.entityNameToJoinsMap[entityName] = [joinSpec];
              }
            } else {
              const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
              alterTableStatement += fieldName + ' ' + sqlColumnType + (isUnique ? ' UNIQUE' : '');
              await dbManager.tryExecuteSqlWithoutCls(alterTableStatement);
            }
          }
        }
      );
    } catch (error) {
      const entityMetadata = getTypeMetadata(entityClass as any);
      let createTableStatement = `CREATE TABLE ${schema}.${entityName} (`;
      let fieldCnt = 0;

      await forEachAsyncSequential(
        Object.entries(entityMetadata),
        async ([fieldName, fieldTypeName]: [any, any]) => {
          let baseFieldTypeName = fieldTypeName;
          let isArray = false;
          let sqlColumnType: string = '';

          if (fieldTypeName.endsWith('[]')) {
            baseFieldTypeName = fieldTypeName.slice(0, -2);
            isArray = true;
          }

          if (fieldName === '_id') {
            sqlColumnType = 'BIGSERIAL PRIMARY KEY';
          } else {
            switch (baseFieldTypeName) {
              case 'integer':
                sqlColumnType = 'INTEGER';
                break;
              case 'bigint':
                sqlColumnType = 'BIGINT';
                break;
              case 'number':
                sqlColumnType = 'DOUBLE PRECISION';
                break;
              case 'boolean':
                sqlColumnType = 'BOOLEAN';
                break;
              case 'string':
                if (fieldName.endsWith('Id') || fieldName === 'id') {
                  if (fieldName === 'id') {
                    sqlColumnType = 'BIGINT';
                  } else {
                    sqlColumnType = 'BIGINT';
                  }
                } else {
                  sqlColumnType = 'VARCHAR';
                }
                break;
            }
          }

          if (!sqlColumnType && baseFieldTypeName[0] === '(') {
            const enumValues = baseFieldTypeName.slice(1).split(/[|)]/);
            const firstEnumValue = enumValues[0];
            if (firstEnumValue[0] === "'") {
              sqlColumnType = 'VARCHAR';
            } else {
              const hasFloat = enumValues.reduce(
                (hasFloat: boolean, enumValue: string) =>
                  hasFloat || parseInt(enumValue, 10).toString().length !== enumValue.length,
                false
              );
              if (hasFloat) {
                sqlColumnType = 'DOUBLE PRECISION';
              } else {
                sqlColumnType = 'INTEGER';
              }
            }
          }

          if (
            isArray &&
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
            const relationEntityName = baseFieldTypeName;
            if (this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName]) {
              this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName].push(idFieldName);
            } else {
              this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName] = [idFieldName];
            }
            const joinSpec = {
              joinTableName: relationEntityName,
              fieldName: '_id',
              joinTableFieldName: idFieldName
            };
            if (this.entityNameToJoinsMap[entityName]) {
              this.entityNameToJoinsMap[entityName].push(joinSpec);
            } else {
              this.entityNameToJoinsMap[entityName] = [joinSpec];
            }
          } else if (
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
            const relationEntityName = baseFieldTypeName;
            if (this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName]) {
              this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName].push(idFieldName);
            } else {
              this.entityNameToAdditionalIdPropertyNamesMap[relationEntityName] = [idFieldName];
            }
            const joinSpec = {
              joinTableName: relationEntityName,
              fieldName: '_id',
              joinTableFieldName: idFieldName
            };
            if (this.entityNameToJoinsMap[entityName]) {
              this.entityNameToJoinsMap[entityName].push(joinSpec);
            } else {
              this.entityNameToJoinsMap[entityName] = [joinSpec];
            }
          } else if (isArray) {
            let createAdditionalTableStatement = `CREATE TABLE IF NOT EXISTS ${schema}.${entityName +
              fieldName.slice(0, -1)} (`;
            const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
            createAdditionalTableStatement +=
              'id BIGINT, ' + idFieldName + ' BIGINT, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';
            await dbManager.tryExecuteSqlWithoutCls(createAdditionalTableStatement);

            const joinSpec = {
              joinTableName: entityName + fieldName.slice(0, -1),
              fieldName: '_id',
              joinTableFieldName: idFieldName
            };

            if (this.entityNameToJoinsMap[entityName]) {
              this.entityNameToJoinsMap[entityName].push(joinSpec);
            } else {
              this.entityNameToJoinsMap[entityName] = [joinSpec];
            }
          } else {
            if (fieldCnt > 0) {
              createTableStatement += ', ';
            }
            const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
            createTableStatement += fieldName + ' ' + sqlColumnType + (isUnique ? ' UNIQUE' : '');
            fieldCnt++;
          }
        }
      );

      await dbManager.tryExecuteSqlWithoutCls(
        createTableStatement +
          ')' +
          (this.entityNameToAdditionalSqlCreateTableStatementOptionsMap[entityName]
            ? ' ' + this.entityNameToAdditionalSqlCreateTableStatementOptionsMap[entityName]
            : '')
      );
    }
  }

  private async createIndex(
    dbManager: AbstractDbManager,
    entityName: string,
    schema: string | undefined,
    indexFields: string[],
    isUnique = false
  ) {
    const indexName = entityName + indexFields.join('');
    const indexUsingOption = this.indexNameToUsingOptionMap[indexName];
    const additionalSqlCreateIndexStatementOptions = this
      .indexNameToAdditionalSqlCreateIndexStatementOptionsMap[indexName];
    const createIndexStatement = `CREATE ${
      isUnique ? 'UNIQUE' : ''
    } INDEX IF NOT EXISTS ${entityName}_${indexFields.join('_')} ON ${schema}.${entityName} ${
      indexUsingOption ? 'USING ' + indexUsingOption : ''
    } (${indexFields.join(', ')}) ${additionalSqlCreateIndexStatementOptions ?? ''}`;

    await dbManager.tryExecuteSqlWithoutCls(createIndexStatement);
  }

  private async createUniqueIndex(
    dbManager: AbstractDbManager,
    entityName: string,
    schema: string | undefined,
    indexFields: string[]
  ) {
    await this.createIndex(dbManager, entityName, schema, indexFields, true);
  }
}

export default new EntityAnnotationContainer();
