import { Pool } from 'pg';
import { HttpException, HttpStatus } from '@nestjs/common';
import { pg } from 'yesql';
import { ErrorResponse, IdWrapper, PostQueryOperations, Projection } from '../Backk';
import { assertIsColumnName, assertIsNumber, assertIsSortDirection } from '../assert';
import SqlExpression from '../sqlexpression/SqlExpression';
import { getTypeMetadata } from '../generateServicesMetadata';
import asyncForEach from '../asyncForEach';
import entityContainer, { JoinSpec } from '../entityContainer';

class PostgreSqlDbManager {
  schema = 'public';
  pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'postgres',
    port: 5432
  });

  async execute<T>(dbOperationFunction: (pool: Pool) => Promise<T>): Promise<T> {
    try {
      return await dbOperationFunction(this.pool);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createItem<T>(
    item: T,
    dbName: string,
    entityClass: Function,
    Types: object
  ): Promise<IdWrapper | ErrorResponse> {
    const entityMetadata = getTypeMetadata(entityClass as any);
    const columns: any = [];
    const values: any = [];

    Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;

      if (fieldTypeName.endsWith('[]')) {
        baseFieldTypeName = fieldTypeName.slice(0, -2);
        isArray = true;
      }

      if (
        !isArray &&
        (baseFieldTypeName[0] !== baseFieldTypeName[0].toUpperCase() || baseFieldTypeName[0] === '(')
      ) {
        columns.push(fieldName);
        values.push((item as any)[fieldName]);
      }
    });

    const sqlColumns = Object.keys(columns).map(
      (fieldName, index) => fieldName + (index === Object.keys(item).length - 1 ? '' : ', ')
    );

    const sqlValuePlaceholders = Object.keys(columns).map(
      (_, index) => `${index + 1}` + (index === Object.keys(item).length - 1 ? '' : ', ')
    );

    let _id: string;
    try {
      const result = await this.execute((pool: Pool) => {
        return pool.query(
          `INSERT INTO ${dbName}.${entityClass.name} (${sqlColumns}) VALUES (${sqlValuePlaceholders}) RETURNING _id`,
          values
        );
      });

      _id = result.rows[0]._id;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await asyncForEach(Object.entries(entityMetadata), async ([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;
      const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';

      if (fieldTypeName.endsWith('[]')) {
        baseFieldTypeName = fieldTypeName.slice(0, -2);
        isArray = true;
      }

      if (
        isArray &&
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1, -1);
        await asyncForEach((item as any)[fieldName], async (subItem: any) => {
          subItem[idFieldName] = _id;
          await this.createItem(subItem, dbName, (Types as any)[relationEntityName], Types);
        });
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        const subItem = (item as any)[fieldName];
        subItem[idFieldName] = _id;
        await this.createItem(subItem, dbName, (Types as any)[relationEntityName], Types);
      } else if (isArray) {
        await asyncForEach((item as any)[fieldName], async (subItem: any) => {
          const insertStatement = `INSERT INTO ${dbName}.${entityClass.name +
            fieldName.slice(0, -1)} (${idFieldName}, ${fieldName}) VALUES($1, $2)`;
          await this.execute((pool: Pool) => {
            return pool.query(insertStatement, [_id, subItem]);
          });
        });
      }
    });

    return {
      _id
    };
  }

  async getItems<T>(
    filters: object,
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: PostQueryOperations,
    dbName: string,
    entityClass: Function
  ): Promise<T[]> {
    try {
      const columns = this.getProjection(projection, entityClass.name);
      const whereStatement = this.getWhereStatement(filters);
      const processedFilters = this.getProcessedFilters(filters);
      const joinStatement = this.getJoinStatement(dbName, entityClass);

      let sortStatement = '';
      if (sortBy && sortDirection) {
        assertIsColumnName('sortBy', sortBy);
        assertIsSortDirection(sortDirection);
        sortStatement = `ORDER BY ${sortBy} ${sortDirection}`;
      }

      let limitAndOffsetStatement = '';
      if (pageNumber && pageSize) {
        assertIsNumber('pageNumber', pageNumber);
        assertIsNumber('pageSize', pageSize);
        limitAndOffsetStatement = `LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`;
      }

      const result = await this.execute((pool: Pool) => {
        return pool.query(
          pg(
            `SELECT ${columns} FROM ${dbName}.${entityClass.name} ${joinStatement} ${whereStatement} 
            ${sortStatement} ${limitAndOffsetStatement}`
          )(processedFilters)
        );
      });
      return result.rows;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getItemById<T>(_id: string, dbName: string, entityClass: Function): Promise<T | ErrorResponse> {
    const joinStatement = this.getJoinStatement(dbName, entityClass);
    let result;

    try {
      result = await this.execute((pool: Pool) => {
        return pool.query(`SELECT * FROM ${dbName}.${entityClass.name} ${joinStatement} WHERE _id = $1`, [
          _id
        ]);
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (result.rows.length === 0) {
      throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
    }

    return result.rows[0];
  }

  async getItemsByIds<T>(
    _ids: string[],
    dbName: string,
    entityClass: Function
  ): Promise<T[] | ErrorResponse> {
    const joinStatement = this.getJoinStatement(dbName, entityClass);
    let result;

    try {
      const idPlaceholders = _ids.map(
        (id, index) => `$${index + 1}` + (index === _ids.length - 1 ? '' : ', ')
      );
      result = await this.execute((pool: Pool) => {
        return pool.query(
          `SELECT * FROM ${dbName}.${entityClass.name} ${joinStatement} WHERE _id IN ${idPlaceholders}`,
          [_ids]
        );
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (result.rows.length === 0) {
      throw new HttpException(`Item with _ids: ${_ids} not found`, HttpStatus.NOT_FOUND);
    }

    return result.rows;
  }

  async getItemBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    dbName: string,
    entityClass: Function
  ): Promise<T | ErrorResponse> {
    const joinStatement = this.getJoinStatement(dbName, entityClass);
    let result;

    try {
      result = await this.execute((pool: Pool) => {
        return pool.query(
          `SELECT * FROM ${dbName}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1`,
          [fieldValue]
        );
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (result.rows.length === 0) {
      throw new HttpException(`Item with ${fieldName}: ${fieldValue} not found`, HttpStatus.NOT_FOUND);
    }

    return result.rows[0];
  }

  async getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    dbName: string,
    entityClass: Function
  ): Promise<T[] | ErrorResponse> {
    const joinStatement = this.getJoinStatement(dbName, entityClass);
    let result;

    try {
      result = await this.execute((pool: Pool) => {
        return pool.query(
          `SELECT * FROM ${dbName}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1`,
          [fieldValue]
        );
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (result.rows.length === 0) {
      throw new HttpException(`Item with ${fieldName}: ${fieldValue} not found`, HttpStatus.NOT_FOUND);
    }

    return result.rows;
  }

  async updateItem<T extends { _id: string | undefined; id: string | undefined }>(
    { _id, ...restOfItem }: T,
    dbName: string,
    entityClass: Function,
    Types: object
  ): Promise<void | ErrorResponse> {
    const entityMetadata = getTypeMetadata(entityClass as any);
    const columns: any = [];
    const values: any = [];

    await asyncForEach(Object.entries(entityMetadata), async ([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;
      const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';

      if (fieldTypeName.endsWith('[]')) {
        baseFieldTypeName = fieldTypeName.slice(0, -2);
        isArray = true;
      }

      if (
        isArray &&
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1, -1);
        await asyncForEach((restOfItem as any)[fieldName], async (subItem: any) => {
          await this.updateItem(subItem, dbName, (Types as any)[relationEntityName], Types);
        });
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        await this.updateItem(
          (restOfItem as any)[fieldName],
          dbName,
          (Types as any)[relationEntityName],
          Types
        );
      } else if (isArray) {
        await asyncForEach((restOfItem as any)[fieldName], async (subItem: any) => {
          const insertStatement = `UPDATE ${dbName}.${entityClass.name +
            fieldName.slice(0, -1)} SET ${fieldName} = $1 WHERE ${idFieldName} = $2`;
          await this.execute((pool: Pool) => {
            return pool.query(insertStatement, [subItem, _id]);
          });
        });
      } else {
        columns.push(fieldName);
        values.push((restOfItem as any)[fieldName]);
      }
    });

    try {
      const setStatements = Object.keys(columns).map(
        (fieldName, index) =>
          fieldName + ' = $${index + 2}' + (index === Object.keys(columns).length - 1 ? '' : ', ')
      );

      const idFieldName = _id === undefined ? 'id' : '_id';
      await this.execute((pool: Pool) => {
        return pool.query(
          `UPDATE ${dbName}.${entityClass.name} SET ${setStatements} WHERE ${idFieldName} = $1`,
          [_id === undefined ? restOfItem.id : _id, ...values]
        );
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteItemById(_id: string, dbName: string, entityClass: Function): Promise<void | ErrorResponse> {
    await asyncForEach(
      Object.values(entityContainer.entityNameToJoinsMap[entityClass.name]),
      async (joinSpec: JoinSpec) => {
        try {
          await this.execute((pool: Pool) => {
            return pool.query(
              `DELETE FROM ${dbName}.${joinSpec.joinTableName} WHERE ${joinSpec.joinTableFieldName} = $1`,
              [_id]
            );
          });
        } catch (error) {
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    );

    try {
      await this.execute((pool: Pool) => {
        return pool.query(`DELETE FROM ${dbName}.${entityClass.name} WHERE _id = $1`, [_id]);
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteAllItems(dbName: string, entityClass: Function): Promise<void | ErrorResponse> {
    await asyncForEach(
      Object.values(entityContainer.entityNameToJoinsMap[entityClass.name]),
      async (joinSpec: JoinSpec) => {
        try {
          await this.execute((pool: Pool) => {
            return pool.query(`DELETE FROM ${dbName}.${joinSpec.joinTableName}`);
          });
        } catch (error) {
          throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    );

    try {
      await this.execute((pool: Pool) => {
        return pool.query(`DELETE FROM ${dbName}.${entityClass.name}`);
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getProjection({ includeResponseFields }: Projection, tableName: string) {
    if (includeResponseFields && includeResponseFields.length > 0) {
      return includeResponseFields.map(
        (fieldName, index) =>
          (fieldName.includes('.') ? fieldName : `${tableName}.${fieldName}`) +
          (index === includeResponseFields.length - 1 ? '' : ', ')
      );
    }

    return '*';
  }

  private getWhereStatement(filters: object) {
    let whereStatement = 'WHERE ';

    Object.entries(filters).forEach(([fieldName, filter], index) => {
      if (filter instanceof SqlExpression) {
        whereStatement += filter.toSqlString();
      } else {
        whereStatement += fieldName + ' = ' + `:${fieldName}`;
      }

      if (index !== Object.keys(filters).length - 1) {
        whereStatement += ' AND ';
      }
    });

    return whereStatement;
  }

  private getProcessedFilters(filters: object) {
    const processedFilters: { [key: string]: any } = {};

    Object.entries(filters).forEach(([fieldName, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v, index) => {
          processedFilters[`${fieldName}${index + 1}`] = v;
        });
      } else {
        processedFilters[fieldName] = value;
      }
    });
    return processedFilters;
  }

  private getJoinStatement(dbName: string, entityClass: Function) {
    let joinStatement = '';

    Object.values(entityContainer.entityNameToJoinsMap[entityClass.name]).forEach((joinSpec, index) => {
      if (index !== 0) {
        joinStatement += ' ';
      }

      joinStatement += 'JOIN ';
      joinStatement += dbName + '.' + joinSpec.joinTableName;
      joinStatement += ' ON ';
      joinStatement +=
        dbName +
        '.' +
        entityClass.name +
        '.' +
        joinSpec.fieldName +
        ' = ' +
        dbName +
        '.' +
        joinSpec.joinTableName +
        '.' +
        joinSpec.joinTableFieldName;
    });

    return joinStatement;
  }
}

export default new PostgreSqlDbManager();
