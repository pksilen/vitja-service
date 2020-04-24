import postgreSqlDbManager from './dbmanager/postgreSqlDbManager';
import { Pool } from 'pg';
import { getTypeMetadata } from './generateServicesMetadata';

export interface ManyToManyRelationTableSpec {
  tableName: string;
  id1Name: string;
  id2Name: string;
}

class EntityContainer {
  private entityNameToClassMap: { [key: string]: Function } = {};
  private entityNameToAdditionalPropertyNamesMap: { [key: string]: string[] } = {};
  private manyToManyRelationTableSpecs: ManyToManyRelationTableSpec[] = [];

  addEntityNameAndClass(entityName: string, entityClass: Function) {
    this.entityNameToClassMap[entityName] = entityClass;
  }

  addEntityAdditionalPropertyName(entityName: string, propertyName: string) {
    if (this.entityNameToAdditionalPropertyNamesMap[entityName]) {
      this.entityNameToAdditionalPropertyNamesMap[entityName].push(propertyName);
    } else {
      this.entityNameToAdditionalPropertyNamesMap[entityName] = [propertyName];
    }
  }

  addManyToManyRelationTableSpec(manyToManyRelationTableSpec: ManyToManyRelationTableSpec) {
    this.manyToManyRelationTableSpecs.push(manyToManyRelationTableSpec);
  }

  private async asyncForEach(array: any, callback: Function) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async createTables(schema: string) {
    await this.asyncForEach(
      Object.entries(this.entityNameToClassMap),
      async ([entityName, entityClass]: [any, any]) => {
        try {
          await this.createTable(entityName, entityClass, schema);
        } catch (error) {
          // NOOP
        }
      }
    );

    await this.asyncForEach(
      Object.entries(this.entityNameToAdditionalPropertyNamesMap),
      async ([entityName, additionalPropertyNames]: [any, any]) => {
        await this.asyncForEach(additionalPropertyNames, async (additionalPropertyName: any) => {
          const result = await postgreSqlDbManager.execute((pool: Pool) => {
            return pool.query(`SELECT * FROM ${schema}.${entityName} LIMIT 1`);
          });
          if (
            !result.fields.find((field) => field.name.toLowerCase() === additionalPropertyName.toLowerCase())
          ) {
            let alterTableStatement = `ALTER TABLE ${schema}.${entityName} ADD `;
            alterTableStatement += additionalPropertyName + ' VARCHAR';
            await postgreSqlDbManager.execute((pool: Pool) => {
              return pool.query(alterTableStatement);
            });
          }
        });
      }
    );
  }

  private async createTable(entityName: string, entityClass: Function, schema: string) {
    const response = postgreSqlDbManager.execute((pool: Pool) => {
      return pool.query(`SELECT * FROM ${schema}.${entityName} LIMIT 1`);
    });

    response.catch(async () => {
      const entityMetadata = getTypeMetadata(entityClass as any);
      let createTableStatement = `CREATE TABLE ${schema}.${entityName} (`;
      let fieldCnt = 0;

      await this.asyncForEach(
        Object.entries(entityMetadata),
        async ([fieldName, fieldTypeName]: [any, any]) => {
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
            case 'number':
              sqlColumnType = 'DOUBLE PRECISION';
              break;
            case 'boolean':
              sqlColumnType = 'BOOLEAN';
              break;
            case 'string':
              sqlColumnType = 'VARCHAR';
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
            if (this.entityNameToAdditionalPropertyNamesMap[relationEntityName]) {
              this.entityNameToAdditionalPropertyNamesMap[relationEntityName].push(idFieldName);
            } else {
              this.entityNameToAdditionalPropertyNamesMap[relationEntityName] = [idFieldName];
            }
          } else if (
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
            const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            if (this.entityNameToAdditionalPropertyNamesMap[relationEntityName]) {
              this.entityNameToAdditionalPropertyNamesMap[relationEntityName].push(idFieldName);
            } else {
              this.entityNameToAdditionalPropertyNamesMap[relationEntityName] = [idFieldName];
            }
          } else if (isArray) {
            let createAdditionalTableStatement = `CREATE TABLE IF NOT EXISTS ${schema}.${entityName +
              fieldName.slice(0, -1)} (`;
            const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
            createAdditionalTableStatement +=
              idFieldName + ' VARCHAR, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';
            await postgreSqlDbManager.execute((pool: Pool) => {
              return pool.query(createAdditionalTableStatement);
            });
          } else {
            if (fieldCnt > 0) {
              createTableStatement += ', ';
            }
            createTableStatement += fieldName + ' ' + sqlColumnType;
            fieldCnt++;
          }
        }
      );

      createTableStatement += ')';
      await postgreSqlDbManager.execute((pool: Pool) => {
        return pool.query(createTableStatement);
      });
    });

    response.then(async (result) => {
      const entityMetadata = getTypeMetadata(entityClass as any);
      await this.asyncForEach(
        Object.entries(entityMetadata),
        async ([fieldName, fieldTypeName]: [any, any]) => {
          if (!result.fields.find((field) => field.name.toLowerCase() === fieldName.toLowerCase())) {
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
              case 'number':
                sqlColumnType = 'DOUBLE PRECISION';
                break;
              case 'boolean':
                sqlColumnType = 'BOOLEAN';
                break;
              case 'string':
                sqlColumnType = 'VARCHAR';
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

            if (isArray && baseFieldTypeName[0] === baseFieldTypeName.toUpperCase()) {
              const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
              const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1, -1);
              if (this.entityNameToAdditionalPropertyNamesMap[relationEntityName]) {
                this.entityNameToAdditionalPropertyNamesMap[relationEntityName].push(idFieldName);
              } else {
                this.entityNameToAdditionalPropertyNamesMap[relationEntityName] = [idFieldName];
              }
              return;
            } else if (baseFieldTypeName[0] === baseFieldTypeName.toUpperCase()) {
              const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
              const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
              if (this.entityNameToAdditionalPropertyNamesMap[relationEntityName]) {
                this.entityNameToAdditionalPropertyNamesMap[relationEntityName].push(idFieldName);
              } else {
                this.entityNameToAdditionalPropertyNamesMap[relationEntityName] = [idFieldName];
              }
              return;
            } else if (isArray) {
              let createAdditionalTableStatement = `CREATE TABLE IF NOT EXISTS ${schema}.${entityName +
                fieldName.slice(0, -1)} (`;
              const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
              createAdditionalTableStatement +=
                idFieldName + ' VARCHAR, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';
              await postgreSqlDbManager.execute((pool: Pool) => {
                return pool.query(createAdditionalTableStatement);
              });
            } else {
              alterTableStatement += fieldName + ' ' + sqlColumnType;
              await postgreSqlDbManager.execute((pool: Pool) => {
                return pool.query(alterTableStatement);
              });
            }
          }
        }
      );
    });

    return response;
  }
}

export default new EntityContainer();
