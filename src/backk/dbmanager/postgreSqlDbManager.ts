import { Pool } from 'pg';
import { HttpException, HttpStatus } from '@nestjs/common';
import { pg } from 'yesql';
import { ErrorResponse, IdWrapper, PostQueryOperations, Projection } from '../Backk';
import { assertIsColumnName, assertIsNumber, assertIsSortDirection } from '../assert';
import SqlExpression from '../sqlexpression/SqlExpression';
import { getTypeMetadata } from '../generateServicesMetadata';
import asyncForEach from '../asyncForEach';

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

      if (fieldTypeName.endsWith('[]')) {
        baseFieldTypeName = fieldTypeName.slice(0, -2);
        isArray = true;
      }

      const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';

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
          let insertStatement = `INSERT INTO ${dbName}.${entityClass.name +
            fieldName.slice(0, -1)} (${idFieldName}) VALUES($1)`;
          await this.execute((pool: Pool) => {
            return pool.query(insertStatement, [_id]);
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
    tableName: string,
    joinStatement?: string
  ): Promise<T[]> {
    try {
      const columns = this.getProjection(projection, tableName);
      const whereStatement = this.getWhereStatement(filters);
      const processedFilters = this.getProcessedFilters(filters);

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
            `SELECT ${columns} FROM ${dbName}.${tableName} ${joinStatement ??
              ''} ${whereStatement} ${sortStatement} ${limitAndOffsetStatement}`
          )(processedFilters)
        );
      });
      return result.rows;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getItemById<T>(
    _id: string,
    dbName: string,
    tableName: string,
    joinStatement?: string
  ): Promise<T | ErrorResponse> {
    let result;
    try {
      result = await this.execute((pool: Pool) => {
        return pool.query(`SELECT * FROM ${dbName}.${tableName} ${joinStatement ?? ''} WHERE _id = $1`, [
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
    tableName: string,
    joinStatement?: string
  ): Promise<T[] | ErrorResponse> {
    let result;
    try {
      const idPlaceholders = _ids.map(
        (id, index) => `$${index + 1}` + (index === _ids.length - 1 ? '' : ', ')
      );
      result = await this.execute((pool: Pool) => {
        return pool.query(
          `SELECT * FROM ${dbName}.${tableName} ${joinStatement ?? ''} WHERE _id IN ${idPlaceholders}`,
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
    tableName: string,
    joinStatement?: string
  ): Promise<T | ErrorResponse> {
    let result;
    try {
      result = await this.execute((pool: Pool) => {
        return pool.query(
          `SELECT * FROM ${dbName}.${tableName} ${joinStatement ?? ''} WHERE ${fieldName} = $1`,
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
    tableName: string,
    joinStatement?: string
  ): Promise<T[] | ErrorResponse> {
    let result;
    try {
      result = await this.execute((pool: Pool) => {
        return pool.query(
          `SELECT * FROM ${dbName}.${tableName} ${joinStatement ?? ''} WHERE ${fieldName} = $1`,
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

  async updateItem<T extends { _id: string }>(
    { _id, ...restOfItem }: T,
    dbName: string,
    tableName: string
  ): Promise<void | ErrorResponse> {
    try {
      const setStatements = Object.keys(restOfItem).map(
        (fieldName, index) =>
          fieldName + ' = $${index + 2}' + (index === Object.keys(restOfItem).length - 1 ? '' : ', ')
      );
      const values = Object.values(restOfItem);
      await this.execute((pool: Pool) => {
        return pool.query(`UPDATE ${dbName}.${tableName} SET ${setStatements} WHERE _id = $1`, [
          _id,
          ...values
        ]);
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteItemById(_id: string, dbName: string, tableName: string): Promise<void | ErrorResponse> {
    try {
      await this.execute((pool: Pool) => {
        return pool.query(`DELETE FROM ${dbName}.${tableName} WHERE _id = $1`, [_id]);
      });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteAllItems(dbName: string, tableName: string): Promise<void | ErrorResponse> {
    try {
      await this.execute((pool: Pool) => {
        return pool.query(`DELETE FROM ${dbName}.${tableName}`);
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
}

export default new PostgreSqlDbManager();
