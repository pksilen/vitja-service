import { Pool, QueryConfig, QueryResult, types } from 'pg';
import { Injectable } from '@nestjs/common';
import { pg } from 'yesql';
import { Parser } from 'expr-eval';
import _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import joinjs from 'join-js';
import {
  ErrorResponse,
  IdWrapper,
  PostQueryOps,
  OptionalProjection,
  OptPostQueryOps
} from '../Backk';
import { assertIsColumnName, assertIsNumber, assertIsSortDirection } from '../assert';
import SqlExpression from '../sqlexpression/SqlExpression';
import { getTypeMetadata } from '../generateServicesMetadata';
import forEachAsyncSequential from '../forEachAsyncSequential';
import entityContainer, { JoinSpec } from '../entityContainer';
import AbstractDbManager, { Field } from './AbstractDbManager';
import getInternalServerErrorResponse from '../getInternalServerErrorResponse';
import getNotFoundErrorResponse from '../getNotFoundErrorResponse';
import forEachAsyncParallel from '../forEachAsyncParallel';
import getConflictErrorResponse from '../getConflictErrorResponse';

@Injectable()
export default class PostgreSqlDbManager extends AbstractDbManager {
  private pool: Pool;

  constructor(
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    public readonly schema: string
  ) {
    super();

    types.setTypeParser(20, 'text', parseInt);

    this.pool = new Pool({
      user,
      host,
      database,
      password,
      port
    });
  }

  async tryExecute<T>(dbOperationFunction: (pool: Pool) => Promise<T>): Promise<T> {
    return await dbOperationFunction(this.pool);
  }

  async isDbReady(): Promise<boolean> {
    const createTableStatement = `CREATE TABLE IF NOT EXISTS ${this.schema}.__BACKK__ (dummy INT)`;

    try {
      await this.tryExecuteSql(createTableStatement);
      return true;
    } catch (error) {
      return false;
    }
  }

  async tryExecuteSql<T>(sqlStatement: string, values?: any[]): Promise<Field[]> {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(sqlStatement);
    }

    const result = await this.pool.query(sqlStatement, values);
    return result.fields;
  }

  async tryExecuteQuery(sqlStatement: string, values?: any[]): Promise<QueryResult<any>> {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(sqlStatement);
    }

    return await this.pool.query(sqlStatement, values);
  }

  async tryExecuteQueryWithConfig(queryConfig: QueryConfig): Promise<QueryResult<any>> {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(queryConfig.text);
    }

    return await this.pool.query(queryConfig);
  }

  async createItem<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object
  ): Promise<IdWrapper | ErrorResponse> {
    try {
      const entityMetadata = getTypeMetadata(entityClass as any);
      Object.keys(item)
        .filter((itemKey) => itemKey.endsWith('Id'))
        .forEach((itemKey) => {
          entityMetadata[itemKey] = 'integer';
        });
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
          (baseFieldTypeName[0] !== baseFieldTypeName[0].toUpperCase() || baseFieldTypeName[0] === '(') &&
          fieldName !== '_id'
        ) {
          columns.push(fieldName);
          if (fieldName === 'id' || fieldName.endsWith('Id')) {
            values.push(parseInt((item as any)[fieldName], 10));
          } else {
            values.push((item as any)[fieldName]);
          }
        }
      });

      const sqlColumns = columns.map((fieldName: any) => fieldName).join(', ');
      const sqlValuePlaceholders = columns.map((_: any, index: number) => `$${index + 1}`).join(', ');
      const getIdSqlStatement = Object.keys(entityMetadata).includes('_id') ? 'RETURNING _id' : '';

      const result = await this.tryExecuteQuery(
        `INSERT INTO ${this.schema}.${entityClass.name} (${sqlColumns}) VALUES (${sqlValuePlaceholders}) ${getIdSqlStatement}`,
        values
      );

      const _id = result.rows[0]?._id?.toString();

      await forEachAsyncParallel(
        Object.entries(entityMetadata),
        async ([fieldName, fieldTypeName]: [any, any]) => {
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
            await forEachAsyncParallel((item as any)[fieldName], async (subItem: any) => {
              subItem[idFieldName] = _id;
              await this.createItem(subItem, (Types as any)[relationEntityName], Types);
            });
          } else if (
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            const subItem = (item as any)[fieldName];
            subItem[idFieldName] = _id;
            await this.createItem(subItem, (Types as any)[relationEntityName], Types);
          } else if (isArray) {
            await forEachAsyncParallel((item as any)[fieldName], async (subItem: any) => {
              const insertStatement = `INSERT INTO ${this.schema}.${entityClass.name +
                fieldName.slice(0, -1)} (${idFieldName}, ${fieldName.slice(0, -1)}) VALUES($1, $2)`;
              await this.tryExecuteSql(insertStatement, [_id, subItem]);
            });
          }
        }
      );

      return {
        _id
      };
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItems<T>(
    filters: SqlExpression[],
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: PostQueryOps,
    entityClass: new () => T,
    Types: object
  ): Promise<T[] | ErrorResponse> {
    try {
      const columns = this.getProjection(projection, entityClass, Types);
      const whereStatement = this.getWhereStatement(filters, entityClass);
      const filterValues = this.getFilterValues(filters);
      const joinStatement = this.getJoinStatement(entityClass, Types);
      const sortStatement = this.getSortStatement(sortBy, sortDirection, entityClass);
      const pagingStatement = PostgreSqlDbManager.getPagingStatement(pageNumber, pageSize);

      const result = await this.tryExecuteQueryWithConfig(
        pg(
          `SELECT ${columns} FROM ${this.schema}.${entityClass.name} ${joinStatement} ${whereStatement} ${sortStatement} ${pagingStatement}`
        )(filterValues)
      );

      const resultMaps = this.createResultMaps(entityClass, Types, projection);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      return rows;
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  private static getPagingStatement(pageNumber?: number, pageSize?: number) {
    let limitAndOffsetStatement = '';

    if (pageNumber && pageSize) {
      assertIsNumber('pageNumber', pageNumber);
      assertIsNumber('pageSize', pageSize);
      limitAndOffsetStatement = `LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`;
    }

    return limitAndOffsetStatement;
  }

  private getSortStatement<T>(
    sortBy: string | undefined,
    sortDirection: undefined | 'ASC' | 'DESC',
    entityClass: { new (): T }
  ) {
    let sortStatement = '';

    if (sortBy && sortDirection) {
      assertIsColumnName('sortBy', sortBy);
      assertIsSortDirection(sortDirection);

      const sortColumn = sortBy.includes('.') ? sortBy : this.schema + '.' + entityClass.name + '.' + sortBy;

      sortStatement = `ORDER BY ${sortColumn} ${sortDirection}`;
    }

    return sortStatement;
  }

  async getItemById<T>(_id: string, entityClass: new () => T, Types: object): Promise<T | ErrorResponse> {
    try {
      const sqlColumns = this.getProjection({}, entityClass, Types);
      const joinStatement = this.getJoinStatement(entityClass, Types);

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE _id = $1`,
        [parseInt(_id, 10)]
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      return rows[0];
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItemsByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    Types: object,
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    try {
      const sqlColumns = this.getProjection(projection, entityClass, Types);
      const joinStatement = this.getJoinStatement(entityClass, Types);
      const sortStatement = this.getSortStatement(sortBy, sortDirection, entityClass);
      const pagingStatement = PostgreSqlDbManager.getPagingStatement(pageNumber, pageSize);
      const numericIds = _ids.map((id) => parseInt(id, 10));
      const idPlaceholders = _ids.map((_, index) => `$${index + 1}`).join(', ');

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE _id IN (${idPlaceholders}) ${sortStatement} ${pagingStatement}`,
        numericIds
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item with _ids: ${_ids} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      return rows;
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItemBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object
  ): Promise<T | ErrorResponse> {
    try {
      const sqlColumns = this.getProjection({}, entityClass, Types);
      const joinStatement = this.getJoinStatement(entityClass, Types);

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1`,
        [fieldValue]
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item with ${fieldName}: ${fieldValue} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      return rows[0];
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object,
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    try {
      const sqlColumns = this.getProjection(projection, entityClass, Types);
      const joinStatement = this.getJoinStatement(entityClass, Types);
      const sortStatement = this.getSortStatement(sortBy, sortDirection, entityClass);
      const pagingStatement = PostgreSqlDbManager.getPagingStatement(pageNumber, pageSize);

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1 ${sortStatement} ${pagingStatement}`,
        [fieldValue]
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item(s) with ${fieldName}: ${fieldValue} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      return rows;
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async updateItem<T extends { _id: string; id?: string }>(
    { _id, ...restOfItem }: T,
    entityClass: new () => T,
    Types: object,
    preCondition?: Partial<T> | [string, Partial<T>],
    shouldCheckIfItemExists: boolean = true
  ): Promise<void | ErrorResponse> {
    if (shouldCheckIfItemExists) {
      const itemOrErrorResponse = await this.getItemById<T>(_id, entityClass, Types);
      if ('errorMessage' in itemOrErrorResponse && 'statusCode' in itemOrErrorResponse) {
        console.log(itemOrErrorResponse);
        return itemOrErrorResponse;
      }

      if (preCondition && !Array.isArray(preCondition) && !_.isMatch(itemOrErrorResponse, preCondition)) {
        return getConflictErrorResponse(
          `Update precondition ${JSON.stringify(preCondition)} was not satisfied`
        );
      } else if (
        preCondition &&
        Array.isArray(preCondition) &&
        !Parser.evaluate(preCondition[0], preCondition[1] as any)
      ) {
        return getConflictErrorResponse(
          `Update precondition ${preCondition[0]} with values ${JSON.stringify(
            preCondition[1]
          )} was not satisfied`
        );
      }
    }

    try {
      const entityMetadata = getTypeMetadata(entityClass as any);
      const columns: any = [];
      const values: any = [];
      const promises: Array<Promise<any>> = [];

      await forEachAsyncSequential(
        Object.entries(entityMetadata),
        async ([fieldName, fieldTypeName]: [any, any]) => {
          if ((restOfItem as any)[fieldName] === undefined) {
            return;
          }

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
            promises.push(
              forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
                await this.updateItem(subItem, (Types as any)[relationEntityName], Types, undefined, false);
              })
            );
          } else if (
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            promises.push(
              this.updateItem(
                (restOfItem as any)[fieldName],
                (Types as any)[relationEntityName],
                Types,
                undefined,
                false
              )
            );
          } else if (isArray) {
            promises.push(
              forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
                const updateStatement = `UPDATE ${this.schema}.${entityClass.name +
                  fieldName.slice(0, -1)} SET ${fieldName.slice(0, -1)} = $1 WHERE ${idFieldName} = $2`;
                await this.tryExecuteSql(updateStatement, [subItem, _id]);
              })
            );
          } else if (fieldName !== '_id') {
            columns.push(fieldName);
            values.push((restOfItem as any)[fieldName]);
          }
        }
      );

      const setStatements = columns
        .map((fieldName: any, index: number) => fieldName + ' = ' + `$${index + 2}`)
        .join(', ');

      const idFieldName = _id === undefined ? 'id' : '_id';
      promises.push(
        this.tryExecuteSql(
          `UPDATE ${this.schema}.${entityClass.name} SET ${setStatements} WHERE ${idFieldName} = $1`,
          [_id === undefined ? restOfItem.id : _id, ...values]
        )
      );
      await Promise.all(promises);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async deleteItemById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    preCondition?: Partial<T> | [string, Partial<T>]
  ): Promise<void | ErrorResponse> {
    if (preCondition && !Types) {
      throw new Error('Types argument must be given if preCondition argument is given');
    }

    try {
      if (Types && preCondition) {
        const itemOrErrorResponse = await this.getItemById<T>(_id, entityClass, Types);
        if ('errorMessage' in itemOrErrorResponse && 'statusCode' in itemOrErrorResponse) {
          console.log(itemOrErrorResponse);
          return itemOrErrorResponse;
        }

        if (!Array.isArray(preCondition) && !_.isMatch(itemOrErrorResponse, preCondition)) {
          return getConflictErrorResponse(
            `Delete precondition ${JSON.stringify(preCondition)} was not satisfied`
          );
        } else if (Array.isArray(preCondition) && !Parser.evaluate(preCondition[0], preCondition[1] as any)) {
          return getConflictErrorResponse(
            `Delete precondition ${preCondition[0]} with values ${JSON.stringify(
              preCondition[1]
            )} was not satisfied`
          );
        }
      }

      await Promise.all([
        forEachAsyncParallel(
          Object.values(entityContainer.entityNameToJoinsMap[entityClass.name]),
          async (joinSpec: JoinSpec) => {
            await this.tryExecuteSql(
              `DELETE FROM ${this.schema}.${joinSpec.joinTableName} WHERE ${joinSpec.joinTableFieldName} = $1`,
              [_id]
            );
          }
        ),
        this.tryExecuteSql(`DELETE FROM ${this.schema}.${entityClass.name} WHERE _id = $1`, [_id])
      ]);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    try {
      await Promise.all([
        forEachAsyncParallel(
          Object.values(entityContainer.entityNameToJoinsMap[entityClass.name]),
          async (joinSpec: JoinSpec) => {
            await this.tryExecuteSql(`DELETE FROM ${this.schema}.${joinSpec.joinTableName} `);
          }
        ),
        this.tryExecuteSql(`DELETE FROM ${this.schema}.${entityClass.name}`)
      ]);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  private getProjection({ includeResponseFields }: OptionalProjection, entityClass: Function, Types: object) {
    let projection;

    if (includeResponseFields && includeResponseFields.length > 0) {
      projection = includeResponseFields
        .map((includeResponseFieldName) =>
          includeResponseFieldName.includes('.')
            ? this.schema +
              '.' +
              includeResponseFieldName +
              ' AS ' +
              includeResponseFieldName.replace('.', '_')
            : `${this.schema}.${entityClass.name}.${includeResponseFieldName} AS ${entityClass.name}_${includeResponseFieldName}`
        )
        .join(', ');
    } else {
      const fields: string[] = [];
      this.getFieldsForEntity(fields, entityClass as any, Types);
      projection = fields.join(', ');
    }

    return projection;
  }

  private getFieldsForEntity(fields: string[], entityClass: Function, Types: object) {
    const entityMetadata = getTypeMetadata(entityClass as any);

    Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [string, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;

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
        this.getFieldsForEntity(fields, (Types as any)[relationEntityName], Types);
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        this.getFieldsForEntity(fields, (Types as any)[relationEntityName], Types);
      } else if (isArray) {
        const relationEntityName = entityClass.name + fieldName.slice(0, -1);
        const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';
        fields.push(
          `${this.schema}.${relationEntityName}.${idFieldName} AS ${relationEntityName}_${idFieldName}`
        );

        const singularFieldName = fieldName.slice(0, -1);

        fields.push(
          `${this.schema}.${relationEntityName}.${singularFieldName} AS ${relationEntityName}_${singularFieldName}`
        );
      } else {
        if (fieldName === '_id' || fieldName === 'id' || fieldName.endsWith('Id')) {
          fields.push(
            `CAST(${this.schema}.${entityClass.name}.${fieldName} AS VARCHAR) AS ${entityClass.name}_${fieldName}`
          );
        } else {
          fields.push(`${this.schema}.${entityClass.name}.${fieldName} AS ${entityClass.name}_${fieldName}`);
        }
      }
    });
  }

  private getWhereStatement(filters: SqlExpression[], entityClass: Function) {
    const filtersSql = filters
      .filter((sqlExpression) => sqlExpression.hasValues())
      .map((sqlExpression) => sqlExpression.toSqlString(this.schema, entityClass.name))
      .join(' AND ');

    return filtersSql ? `WHERE ${filtersSql}` : '';
  }

  private getFilterValues(filters: SqlExpression[]) {
    return filters.reduce(
      (filterValues, sqlExpression) => ({ ...filterValues, ...sqlExpression.getValues() }),
      {}
    );
  }

  private getJoinStatement(entityClass: Function, Types: object) {
    let joinStatement = '';

    if (entityContainer.entityNameToJoinsMap[entityClass.name]) {
      entityContainer.entityNameToJoinsMap[entityClass.name].forEach((joinSpec, index) => {
        if (index !== 0) {
          joinStatement += ' ';
        }

        joinStatement += 'JOIN ';
        joinStatement += this.schema + '.' + joinSpec.joinTableName;
        joinStatement += ' ON ';
        joinStatement +=
          this.schema +
          '.' +
          entityClass.name +
          '.' +
          joinSpec.fieldName +
          ' = ' +
          this.schema +
          '.' +
          joinSpec.joinTableName +
          '.' +
          joinSpec.joinTableFieldName;
      });
    }

    const entityMetadata = getTypeMetadata(entityClass as any);

    Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;

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
        joinStatement += this.getJoinStatement((Types as any)[relationEntityName], Types);
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        joinStatement += this.getJoinStatement((Types as any)[relationEntityName], Types);
      }
    });

    return joinStatement;
  }

  private transformResults(results: object[], entityClass: Function, Types: object) {
    results.forEach((result) => this.transformResult(result, entityClass, Types));
  }

  private transformResult(result: any, entityClass: Function, Types: object) {
    const entityMetadata = getTypeMetadata(entityClass as any);

    Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;

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

        this.transformResult(result[fieldName], (Types as any)[relationEntityName], Types);
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

        this.transformResult(result[fieldName], (Types as any)[relationEntityName], Types);
      } else if (isArray && result[fieldName]) {
        const singularFieldName = fieldName.slice(0, -1);
        result[fieldName] = result[fieldName].map((obj: any) => obj[singularFieldName]);
      }
    });
  }

  private createResultMaps(entityClass: Function, Types: object, projection?: OptionalProjection) {
    const resultMaps: any[] = [];
    this.updateResultMaps(entityClass, Types, resultMaps, projection);
    return resultMaps;
  }

  private updateResultMaps(
    entityClassOrName: Function | string,
    Types: object,
    resultMaps: any[],
    projection?: OptionalProjection,
    suppliedEntityMetadata: { [key: string]: string } = {},
    parentEntityClass?: Function
  ) {
    const entityMetadata =
      typeof entityClassOrName === 'function'
        ? getTypeMetadata(entityClassOrName as any)
        : suppliedEntityMetadata;

    const entityName = typeof entityClassOrName === 'function' ? entityClassOrName.name : entityClassOrName;

    const idFieldName = parentEntityClass
      ? parentEntityClass.name.charAt(0).toLowerCase() + parentEntityClass.name.slice(1) + 'Id'
      : Object.keys(entityMetadata).find((fieldName) => fieldName === '_id');

    const resultMap = {
      mapId: entityName + 'Map',
      idProperty: idFieldName ? idFieldName.toLowerCase() : undefined,
      properties: [] as object[],
      collections: [] as object[],
      associations: [] as object[]
    };

    Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;

      if (fieldTypeName.endsWith('[]')) {
        baseFieldTypeName = fieldTypeName.slice(0, -2);
        isArray = true;
      }

      if (
        isArray &&
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        if (!projection || projection.includeResponseFields?.includes(fieldName)) {
          const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1, -1);

          resultMap.collections.push({
            name: fieldName,
            mapId: relationEntityName + 'Map',
            columnPrefix: relationEntityName.toLowerCase() + '_'
          });

          this.updateResultMaps(
            (Types as any)[relationEntityName],
            Types,
            resultMaps,
            projection,
            {},
            entityClassOrName as Function
          );
        }
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        if (!projection || projection.includeResponseFields?.includes(fieldName)) {
          const relationEntityName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

          resultMap.associations.push({
            name: fieldName,
            mapId: relationEntityName + 'Map',
            columnPrefix: relationEntityName.toLowerCase() + '_'
          });

          this.updateResultMaps(
            (Types as any)[relationEntityName],
            Types,
            resultMaps,
            projection,
            {},
            entityClassOrName as Function
          );
        }
      } else if (isArray) {
        if (!projection || projection.includeResponseFields?.includes(fieldName)) {
          const relationEntityName = entityName + fieldName.slice(0, -1);

          resultMap.collections.push({
            name: fieldName,
            mapId: relationEntityName + 'Map',
            columnPrefix: relationEntityName.toLowerCase() + '_'
          });

          this.updateResultMaps(
            relationEntityName,
            Types,
            resultMaps,
            projection,
            {
              [fieldName.slice(0, -1)]: 'integer'
            },
            entityClassOrName as Function
          );
        }
      } else {
        if (fieldName !== idFieldName && fieldName !== '_id') {
          resultMap.properties.push({ name: fieldName, column: fieldName.toLowerCase() });
        }
      }
    });

    resultMaps.push(resultMap);
  }
}
