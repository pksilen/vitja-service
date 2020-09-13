import { getTypeMetadata } from './generateServicesMetadata';
import asyncForEach from './asyncForEach';
import AbstractDbManager from './dbmanager/AbstractDbManager';

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

class EntityContainer {
  private entityNameToClassMap: { [key: string]: Function } = {};
  private entityNameToAdditionalIdPropertyNamesMap: { [key: string]: string[] } = {};
  private manyToManyRelationTableSpecs: ManyToManyRelationTableSpec[] = [];
  entityNameToJoinsMap: { [key: string]: JoinSpec[] } = {};

  addEntityNameAndClass(entityName: string, entityClass: Function) {
    this.entityNameToClassMap[entityName] = entityClass;
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

  async createTables(dbManager: AbstractDbManager) {
    await asyncForEach(
      Object.entries(this.entityNameToClassMap),
      async ([entityName, entityClass]: [any, any]) => {
        try {
          await this.createTable(dbManager, entityName, entityClass, dbManager.schema);
        } catch (error) {
          // NOOP
        }
      }
    );

    await asyncForEach(
      Object.entries(this.entityNameToAdditionalIdPropertyNamesMap),
      async ([entityName, additionalPropertyNames]: [any, any]) => {
        await asyncForEach(additionalPropertyNames, async (additionalPropertyName: any) => {
          const fields = await dbManager.tryExecuteSql(
            `SELECT * FROM ${dbManager.schema}.${entityName} LIMIT 1`
          );
          if (!fields.find((field) => field.name.toLowerCase() === additionalPropertyName.toLowerCase())) {
            let alterTableStatement = `ALTER TABLE ${dbManager.schema}.${entityName} ADD `;
            alterTableStatement += additionalPropertyName + ' BIGINT';
            await dbManager.tryExecuteSql(alterTableStatement);
          }
        });
      }
    );
  }

  private async createTable(
    dbManager: AbstractDbManager,
    entityName: string,
    entityClass: Function,
    schema: string | undefined
  ) {
    const fields = dbManager.tryExecuteSql(`SELECT * FROM ${schema}.${entityName} LIMIT 1`);

    fields.catch(async () => {
      const entityMetadata = getTypeMetadata(entityClass as any);
      let createTableStatement = `CREATE TABLE ${schema}.${entityName} (`;
      let fieldCnt = 0;
      await asyncForEach(Object.entries(entityMetadata), async ([fieldName, fieldTypeName]: [any, any]) => {
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
                sqlColumnType = 'BIGINT';
              } else {
                sqlColumnType = 'VARCHAR';
              }
              break;
          }
        }

        if (!sqlColumnType && baseFieldTypeName[0] === '(') {
          const firstEnumValue = baseFieldTypeName.slice(1).split(/[|)]/)[0];
          if (firstEnumValue[0] === "'") {
            sqlColumnType = 'VARCHAR';
          } else if (parseInt(firstEnumValue, 10).toString().length !== firstEnumValue.length) {
            sqlColumnType = 'DOUBLE PRECISION';
          } else {
            sqlColumnType = 'INTEGER';
          }
        }

        if (
          isArray &&
          baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
          baseFieldTypeName[0] !== '('
        ) {
          const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
          const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1, -1);
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
          const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
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
            idFieldName + ' BIGINT, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';

          await dbManager.tryExecuteSql(createAdditionalTableStatement);

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
          createTableStatement += fieldName + ' ' + sqlColumnType;
          fieldCnt++;
        }
      });

      createTableStatement += ')';
      await dbManager.tryExecuteSql(createTableStatement);
    });

    fields.then(async (fields) => {
      const entityMetadata = getTypeMetadata(entityClass as any);
      await asyncForEach(Object.entries(entityMetadata), async ([fieldName, fieldTypeName]: [any, any]) => {
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
            const firstEnumValue = baseFieldTypeName.slice(1).split(/[|)]/)[0];
            if (firstEnumValue[0] === "'") {
              sqlColumnType = 'VARCHAR';
            } else if (parseInt(firstEnumValue, 10).toString().length !== firstEnumValue.length) {
              sqlColumnType = 'DOUBLE PRECISION';
            } else {
              sqlColumnType = 'INTEGER';
            }
          }

          if (
            isArray &&
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
            const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1, -1);
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
            const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
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
              idFieldName + ' BIGINT, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';
            await dbManager.tryExecuteSql(createAdditionalTableStatement);

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
            alterTableStatement += fieldName + ' ' + sqlColumnType;
            await dbManager.tryExecuteSql(alterTableStatement);
          }
        }
      });
    });

    return fields;
  }
}

export default new EntityContainer();
