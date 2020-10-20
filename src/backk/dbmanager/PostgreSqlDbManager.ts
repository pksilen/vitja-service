import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import joinjs from 'join-js';
import _ from 'lodash';
import { JSONPath } from 'jsonpath-plus';
import { Pool, QueryConfig, QueryResult, types } from 'pg';
import { pg } from 'yesql';
import entityContainer, { JoinSpec } from '../annotations/entity/entityAnnotationContainer';
import { assertIsColumnName, assertIsNumber, assertIsSortDirection } from '../assert';
import {
  ErrorResponse,
  OptionalProjection,
  OptPostQueryOps,
  PostQueryOps,
  RecursivePartial,
  SortBy
} from '../Backk';
import decryptItems from '../crypt/decryptItems';
import encrypt from '../crypt/encrypt';
import hashAndEncryptItem from '../crypt/hashAndEncryptItem';
import shouldEncryptValue from '../crypt/shouldEncryptValue';
import shouldUseRandomInitializationVector from '../crypt/shouldUseRandomInitializationVector';
import forEachAsyncParallel from '../forEachAsyncParallel';
import forEachAsyncSequential from '../forEachAsyncSequential';
import { getTypeMetadata } from '../generateServicesMetadata';
import getBadRequestErrorResponse from '../getBadRequestErrorResponse';
import getConflictErrorResponse from '../getConflictErrorResponse';
import getInternalServerErrorResponse from '../getInternalServerErrorResponse';
import getNotFoundErrorResponse from '../getNotFoundErrorResponse';
import getFieldsFromGraphQlOrJson from '../graphql/getFieldsFromGraphQlOrJson';
import SqlExpression from '../sqlexpression/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import isErrorResponse from '../isErrorResponse';
import entityAnnotationContainer from '../annotations/entity/entityAnnotationContainer';
import { plainToClass } from 'class-transformer';

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

  async reserveDbConnectionFromPool(): Promise<void> {
    this.getClsNamespace()?.set('connection', await this.pool.connect());
    this.getClsNamespace()?.set('localTransaction', false);
    this.getClsNamespace()?.set('globalTransaction', false);
  }

  releaseDbConnectionBackToPool() {
    this.getClsNamespace()
      ?.get('connection')
      .release();
    this.getClsNamespace()?.set('connection', null);
  }

  async beginTransaction(): Promise<void> {
    await this.getClsNamespace()
      ?.get('connection')
      .query('BEGIN');
  }

  async commitTransaction(): Promise<void> {
    await this.getClsNamespace()
      ?.get('connection')
      .query('COMMIT');
  }

  async rollbackTransaction(): Promise<void> {
    await this.getClsNamespace()
      ?.get('connection')
      .query('ROLLBACK');
  }

  async tryExecuteSql<T>(sqlStatement: string, values?: any[]): Promise<Field[]> {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(sqlStatement);
    }

    const result = await this.getClsNamespace()
      ?.get('connection')
      .query(sqlStatement, values);
    return result.fields;
  }

  async tryExecuteSqlWithoutCls<T>(sqlStatement: string, values?: any[]): Promise<Field[]> {
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

    return await this.getClsNamespace()
      ?.get('connection')
      .query(sqlStatement, values);
  }

  async tryExecuteQueryWithConfig(queryConfig: QueryConfig): Promise<QueryResult<any>> {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(queryConfig.text);
    }

    return await this.getClsNamespace()
      ?.get('connection')
      .query(queryConfig);
  }

  async executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse> {
    await this.beginTransaction();
    this.getClsNamespace()?.set('globalTransaction', true);

    const result = await executable();

    if (isErrorResponse(result)) {
      await this.rollbackTransaction();
    } else {
      await this.commitTransaction();
    }

    this.getClsNamespace()?.set('globalTransaction', false);

    return result;
  }

  async createItem<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object,
    maxAllowedItemCount?: number,
    itemCountQueryFilter?: Partial<T>,
    isRecursiveCall = false
  ): Promise<T | ErrorResponse> {
    try {
      if (!isRecursiveCall) {
        await hashAndEncryptItem(item, entityClass, Types);
      }

      if (
        !this.getClsNamespace()?.get('localTransaction') &&
        !this.getClsNamespace()?.get('globalTransaction')
      ) {
        await this.beginTransaction();
        this.getClsNamespace()?.set('localTransaction', true);
      }

      if (!isRecursiveCall && maxAllowedItemCount !== undefined) {
        const itemCountOrErrorResponse = await this.getItemsCount(itemCountQueryFilter, entityClass, Types);

        if (typeof itemCountOrErrorResponse === 'number') {
          if (itemCountOrErrorResponse >= maxAllowedItemCount) {
            return getBadRequestErrorResponse(
              'Cannot create new resource. Maximum resource count would be exceeded'
            );
          }
        } else {
          return itemCountOrErrorResponse;
        }
      }

      const entityMetadata = getTypeMetadata(entityClass as any);
      const additionalMetadata = Object.keys(item)
        .filter((itemKey) => itemKey.endsWith('Id'))
        .reduce((accumulatedMetadata, itemKey) => ({ ...accumulatedMetadata, [itemKey]: 'integer' }), {});
      const columns: any = [];
      const values: any = [];

      Object.entries({ ...entityMetadata, ...additionalMetadata }).forEach(
        ([fieldName, fieldTypeName]: [any, any]) => {
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
        }
      );

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
            const relationEntityName = baseFieldTypeName;
            await forEachAsyncParallel((item as any)[fieldName], async (subItem: any) => {
              subItem[idFieldName] = _id;
              const subItemOrErrorResponse = await this.createItem(
                subItem,
                (Types as any)[relationEntityName],
                Types,
                maxAllowedItemCount,
                itemCountQueryFilter,
                true
              );
              if ('errorMessage' in subItemOrErrorResponse && isErrorResponse(subItemOrErrorResponse)) {
                throw new Error(subItemOrErrorResponse.errorMessage);
              }
            });
          } else if (
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const relationEntityName = baseFieldTypeName;
            const subItem = (item as any)[fieldName];
            subItem[idFieldName] = _id;
            const subItemOrErrorResponse = await this.createItem(
              subItem,
              (Types as any)[relationEntityName],
              Types,
              maxAllowedItemCount,
              itemCountQueryFilter,
              true
            );
            if ('errorMessage' in subItemOrErrorResponse && isErrorResponse(subItemOrErrorResponse)) {
              throw new Error(subItemOrErrorResponse.errorMessage);
            }
          } else if (isArray) {
            await forEachAsyncParallel((item as any)[fieldName], async (subItem: any) => {
              const insertStatement = `INSERT INTO ${this.schema}.${entityClass.name +
                fieldName.slice(0, -1)} (${idFieldName}, ${fieldName.slice(0, -1)}) VALUES($1, $2)`;
              await this.tryExecuteSql(insertStatement, [_id, subItem]);
            });
          }
        }
      );

      if (!isRecursiveCall && !this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }

      return isRecursiveCall ? ({} as any) : this.getItemById(_id, entityClass, Types);
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }

      return getInternalServerErrorResponse(error);
    } finally {
      this.getClsNamespace()?.set('localTransaction', false);
    }
  }

  async createSubItem<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    newSubItem: Omit<U, 'id'>,
    entityClass: new () => T,
    subItemEntityClass: new () => U,
    Types: object
  ): Promise<T | ErrorResponse> {
    try {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.beginTransaction();
      }

      const itemOrErrorResponse = await this.getItemById(_id, entityClass, Types);
      if ('errorMessage' in itemOrErrorResponse) {
        console.log(itemOrErrorResponse);
        return itemOrErrorResponse;
      }

      const parentIdValue = JSONPath({ json: itemOrErrorResponse, path: subItemsPath + '$._id' })[0];
      const parentIdFieldName = entityAnnotationContainer.getAdditionIdPropertyName(subItemEntityClass.name);
      const maxSubItemId = JSONPath({ json: itemOrErrorResponse, path: subItemsPath }).reduce(
        (maxSubItemId: number, subItem: any) => {
          const subItemId = parseInt(subItem.id);
          return subItemId > maxSubItemId ? subItemId : maxSubItemId;
        },
        0
      );
      await this.createItem(
        { ...newSubItem, [parentIdFieldName]: parentIdValue, id: (maxSubItemId + 1).toString() } as any,
        subItemEntityClass,
        Types
      );

      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }

      return this.getItemById(_id, entityClass, Types);
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }

      return getInternalServerErrorResponse(error);
    }
  }

  async getItems<T>(
    filters: Partial<T> | SqlExpression[],
    { pageNumber, pageSize, sortBys, ...projection }: PostQueryOps,
    entityClass: new () => T,
    Types: object
  ): Promise<T[] | ErrorResponse> {
    try {
      let columns;
      let whereStatement;
      let sortStatement;
      try {
        columns = this.tryGetProjection(projection, entityClass, Types);
        whereStatement = this.tryGetWhereStatement(filters, entityClass, types);
        sortStatement = this.tryGetSortStatement(sortBys, entityClass, Types);
      } catch (error) {
        return getBadRequestErrorResponse(error.message);
      }

      const filterValues = this.getFilterValues(filters);
      const joinStatement = this.getJoinStatement(entityClass, Types);
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
      decryptItems(rows, entityClass, Types);
      return rows;
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItemsCount<T>(
    filters: Partial<T> | SqlExpression[] | undefined,
    entityClass: new () => T,
    Types: object
  ): Promise<number | ErrorResponse> {
    try {
      let whereStatement;
      try {
        whereStatement = this.tryGetWhereStatement(filters ?? {}, entityClass, Types);
      } catch (error) {
        return getBadRequestErrorResponse(error.message);
      }

      const filterValues = await this.getFilterValues(filters ?? {});
      const joinStatement = this.getJoinStatement(entityClass, Types);

      const result = await this.tryExecuteQueryWithConfig(
        pg(`SELECT COUNT(*) FROM ${this.schema}.${entityClass.name} ${joinStatement} ${whereStatement}`)(
          filterValues
        )
      );

      return result.rows[0].count;
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

  private tryGetSortStatement<T>(sortBys: SortBy[] | undefined, entityClass: { new (): T }, Types: object) {
    let sortStatement = '';

    if (sortBys) {
      const sortBysStr = sortBys.map(({ sortField, sortDirection }) => {
        assertIsColumnName('sortBy', sortField);
        assertIsSortDirection(sortDirection);

        let projection;
        try {
          projection = this.tryGetProjection({ includeResponseFields: [sortField] }, entityClass, Types);
        } catch (error) {
          throw new Error('Invalid sort field: ' + sortField);
        }

        const sortColumn = this.getSqlColumnFromProjection(projection);
        return sortColumn + ' ' + sortDirection;
      });

      sortStatement = `ORDER BY ${sortBysStr}`;
    }

    return sortStatement;
  }

  async getItemById<T>(_id: string, entityClass: new () => T, Types: object): Promise<T | ErrorResponse> {
    try {
      let sqlColumns;
      try {
        sqlColumns = this.tryGetProjection({}, entityClass, Types);
      } catch (error) {
        return getBadRequestErrorResponse(error.message);
      }
      const joinStatement = this.getJoinStatement(entityClass, Types);

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE ${this.schema}.${entityClass.name}._id = $1`,
        [parseInt(_id, 10)]
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types, {});
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      decryptItems(rows, entityClass, Types);
      return rows[0];
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getSubItem<T extends object, U extends object>(
    _id: string,
    subItemPath: string,
    entityClass: new () => T,
    Types: object
  ): Promise<U | ErrorResponse> {
    try {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.beginTransaction();
      }

      const itemOrErrorResponse = await this.getItemById(_id, entityClass, Types);
      if ('errorMessage' in itemOrErrorResponse) {
        console.log(itemOrErrorResponse);
        return itemOrErrorResponse;
      }

      const subItems = JSONPath({ json: itemOrErrorResponse, path: subItemPath });

      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }

      if (subItems.length > 0) {
        return subItems[0];
      } else {
        return getNotFoundErrorResponse(
          'Item with _id: ' + _id + ', sub item from path ' + subItemPath + ' not found'
        );
      }
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }

      return getInternalServerErrorResponse(error);
    }
  }

  async getItemsByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    Types: object,
    postQueryOps?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    try {
      const projection = {
        includeResponseFields: postQueryOps?.includeResponseFields,
        excludeResponseFields: postQueryOps?.excludeResponseFields
      };

      let sqlColumns;
      let sortStatement;
      try {
        sqlColumns = this.tryGetProjection(projection, entityClass, Types);
        sortStatement = this.tryGetSortStatement(postQueryOps?.sortBys, entityClass, types);
      } catch (error) {
        return getBadRequestErrorResponse(error.message);
      }

      const joinStatement = this.getJoinStatement(entityClass, Types);
      const pagingStatement = PostgreSqlDbManager.getPagingStatement(
        postQueryOps?.pageNumber,
        postQueryOps?.pageSize
      );
      const numericIds = _ids.map((id) => parseInt(id, 10));
      const idPlaceholders = _ids.map((_, index) => `$${index + 1}`).join(', ');

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE _id IN (${idPlaceholders}) ${sortStatement} ${pagingStatement}`,
        numericIds
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item with _ids: ${_ids} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types, projection);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      decryptItems(rows, entityClass, Types);
      return rows;
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItemBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object
  ): Promise<T | ErrorResponse> {
    try {
      const item = {
        [fieldName]: fieldValue
      };

      if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
        (item as any)[fieldName] = encrypt(fieldValue as any, false);
      }

      let sqlColumns;
      try {
        sqlColumns = this.tryGetProjection({}, entityClass, Types);
      } catch (error) {
        return getBadRequestErrorResponse(error.message);
      }

      const joinStatement = this.getJoinStatement(entityClass, Types);

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1`,
        [(item as any)[fieldName]]
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item with ${fieldName}: ${fieldValue} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types, {});
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      decryptItems(rows, entityClass, Types);
      return rows[0];
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItemsBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object,
    postQueryOps?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    try {
      const item = {
        [fieldName]: fieldValue
      };

      if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
        (item as any)[fieldName] = encrypt(fieldValue as any, false);
      }

      const projection = {
        includeResponseFields: postQueryOps?.includeResponseFields,
        excludeResponseFields: postQueryOps?.excludeResponseFields
      };

      let sqlColumns;
      let sortStatement;
      try {
        sqlColumns = this.tryGetProjection(projection, entityClass, Types);
        sortStatement = this.tryGetSortStatement(postQueryOps?.sortBys, entityClass, Types);
      } catch (error) {
        return getBadRequestErrorResponse(error.message);
      }

      const joinStatement = this.getJoinStatement(entityClass, Types);
      const pagingStatement = PostgreSqlDbManager.getPagingStatement(
        postQueryOps?.pageNumber,
        postQueryOps?.pageSize
      );

      const result = await this.tryExecuteQuery(
        `SELECT ${sqlColumns} FROM ${this.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1 ${sortStatement} ${pagingStatement}`,
        [(item as any)[fieldName]]
      );

      if (result.rows.length === 0) {
        return getNotFoundErrorResponse(`Item(s) with ${fieldName}: ${fieldValue} not found`);
      }

      const resultMaps = this.createResultMaps(entityClass, Types, projection);
      const rows = joinjs.map(
        result.rows,
        resultMaps,
        entityClass.name + 'Map',
        entityClass.name.toLowerCase() + '_'
      );
      this.transformResults(rows, entityClass, Types);
      decryptItems(rows, entityClass, Types);
      return rows;
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async updateItem<T extends object & { _id: string; id?: string }>(
    { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    Types: object,
    itemPreCondition?: Partial<T> | string,
    shouldCheckIfItemExists: boolean = true,
    isRecursiveCall = false
  ): Promise<void | ErrorResponse> {
    try {
      if (!isRecursiveCall) {
        await hashAndEncryptItem(restOfItem, entityClass, Types);
      }

      if (!this.getClsNamespace()?.get('transaction') && !this.getClsNamespace()?.get('globalTransaction')) {
        await this.beginTransaction();
        this.getClsNamespace()?.set('localTransaction', true);
      }

      if (shouldCheckIfItemExists) {
        const itemOrErrorResponse = await this.getItemById(_id, entityClass, Types);
        if ('errorMessage' in itemOrErrorResponse && isErrorResponse(itemOrErrorResponse)) {
          console.log(itemOrErrorResponse);
          return itemOrErrorResponse;
        }

        if (
          typeof itemPreCondition === 'string' &&
          (itemPreCondition.match(/require\s*\(/) || itemPreCondition.match(/import\s*\(/))
        ) {
          return getBadRequestErrorResponse('Update precondition expression cannot use require or import');
        }

        if (typeof itemPreCondition === 'object' && !_.isMatch(itemOrErrorResponse, itemPreCondition)) {
          return getConflictErrorResponse(
            `Update precondition ${JSON.stringify(itemPreCondition)} was not satisfied`
          );
        } else {
          // noinspection DynamicallyGeneratedCodeJS
          if (
            typeof itemPreCondition === 'string' &&
            !new Function('const obj = arguments[0]; return ' + itemPreCondition).call(
              null,
              itemOrErrorResponse
            )
          ) {
            return getConflictErrorResponse(`Update precondition ${itemPreCondition} was not satisfied`);
          }
        }
      }

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
            const relationEntityName = baseFieldTypeName;
            promises.push(
              forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
                const possibleErrorResponse = await this.updateItem(
                  subItem,
                  (Types as any)[relationEntityName],
                  Types,
                  undefined,
                  false,
                  true
                );
                if (possibleErrorResponse) {
                  throw new Error(possibleErrorResponse.errorMessage);
                }
              })
            );
          } else if (
            baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
            baseFieldTypeName[0] !== '('
          ) {
            const relationEntityName = baseFieldTypeName;
            const possibleErrorResponse = await this.updateItem(
              (restOfItem as any)[fieldName],
              (Types as any)[relationEntityName],
              Types,
              undefined,
              false,
              true
            );
            if (possibleErrorResponse) {
              throw new Error(possibleErrorResponse.errorMessage);
            }
          } else if (isArray) {
            promises.push(
              forEachAsyncParallel((restOfItem as any)[fieldName], async (subItem: any) => {
                const updateStatement = `UPDATE ${this.schema}.${entityClass.name +
                  fieldName.slice(0, -1)} SET ${fieldName.slice(0, -1)} = $1 WHERE ${idFieldName} = $2`;
                await this.tryExecuteSql(updateStatement, [subItem, _id]);
              })
            );
          } else if (fieldName !== '_id' && fieldName !== 'id') {
            if ((restOfItem as any)[fieldName] !== undefined) {
              columns.push(fieldName);
              values.push((restOfItem as any)[fieldName]);
            }
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

      if (!isRecursiveCall && !this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }
      return getInternalServerErrorResponse(error);
    } finally {
      this.getClsNamespace()?.set('localTransaction', false);
    }
  }

  async deleteItemById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    itemPreCondition?: Partial<T> | string
  ): Promise<void | ErrorResponse> {
    if (itemPreCondition && !Types) {
      throw new Error('Types argument must be given if preCondition argument is given');
    }

    try {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.beginTransaction();
      }

      if (Types && itemPreCondition) {
        const itemOrErrorResponse = await this.getItemById(_id, entityClass, Types);
        if ('errorMessage' in itemOrErrorResponse && isErrorResponse(itemOrErrorResponse)) {
          console.log(itemOrErrorResponse);
          return itemOrErrorResponse;
        }

        if (
          typeof itemPreCondition === 'string' &&
          (itemPreCondition.match(/require\s*\(/) || itemPreCondition.match(/import\s*\(/))
        ) {
          return getBadRequestErrorResponse('Delete precondition expression cannot use require or import');
        }

        if (typeof itemPreCondition === 'object') {
          if (!_.isMatch(itemOrErrorResponse, itemPreCondition)) {
            return getConflictErrorResponse(
              `Delete precondition ${JSON.stringify(itemPreCondition)} was not satisfied`
            );
          }
        } else {
          // noinspection DynamicallyGeneratedCodeJS
          if (
            !new Function('const obj = arguments[0]; return ' + itemPreCondition).call(
              null,
              itemOrErrorResponse
            )
          ) {
            return getConflictErrorResponse(`Delete precondition ${itemPreCondition} was not satisfied`);
          }
        }
      }

      await Promise.all([
        forEachAsyncParallel(
          Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
          async (joinSpec: JoinSpec) => {
            await this.tryExecuteSql(
              `DELETE FROM ${this.schema}.${joinSpec.joinTableName} WHERE ${joinSpec.joinTableFieldName} = $1`,
              [_id]
            );
          }
        ),
        this.tryExecuteSql(`DELETE FROM ${this.schema}.${entityClass.name} WHERE _id = $1`, [_id])
      ]);

      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }

      return getInternalServerErrorResponse(error);
    }
  }

  async deleteSubItems<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    entityClass: new () => T,
    Types: object,
    preCondition?: object | string
  ): Promise<void | ErrorResponse> {
    try {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.beginTransaction();
      }

      const itemOrErrorResponse = await this.getItemById(_id, entityClass, Types);
      if ('errorMessage' in itemOrErrorResponse) {
        console.log(itemOrErrorResponse);
        return itemOrErrorResponse;
      }

      if (preCondition) {
        if (
          typeof preCondition === 'string' &&
          (preCondition.match(/require\s*\(/) || preCondition.match(/import\s*\(/))
        ) {
          return getBadRequestErrorResponse('Delete precondition expression cannot use require or import');
        }

        if (typeof preCondition === 'object') {
          const isPreConditionMatched = Object.entries(preCondition).reduce(
            (isPreconditionMatched, [path, value]) => {
              return isPreconditionMatched && JSONPath({ json: itemOrErrorResponse, path })[0] === value;
            },
            true
          );
          if (!isPreConditionMatched) {
            return getConflictErrorResponse(
              `Delete sub item precondition ${JSON.stringify(preCondition)} was not satisfied`
            );
          }
        }
      }

      const itemInstance = plainToClass(entityClass, itemOrErrorResponse);
      const subItems = JSONPath({ json: itemInstance, path: subItemsPath });
      await forEachAsyncParallel(subItems, async (subItem: any) => {
        await this.deleteItemById(subItem._id, subItem.constructor, Types);
      });

      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }

      return getInternalServerErrorResponse(error);
    }
  }

  async deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    try {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.beginTransaction();
      }

      await Promise.all([
        forEachAsyncParallel(
          Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
          async (joinSpec: JoinSpec) => {
            await this.tryExecuteSql(`DELETE FROM ${this.schema}.${joinSpec.joinTableName}`);
          }
        ),
        this.tryExecuteSql(`DELETE FROM ${this.schema}.${entityClass.name}`)
      ]);

      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.commitTransaction();
      }
    } catch (error) {
      if (!this.getClsNamespace()?.get('globalTransaction')) {
        await this.rollbackTransaction();
      }
      return getInternalServerErrorResponse(error);
    }
  }

  private tryGetProjection(projection: OptionalProjection, entityClass: Function, Types: object) {
    const fields: string[] = [];

    if (projection.includeResponseFields?.[0]?.includes('{')) {
      projection.includeResponseFields = getFieldsFromGraphQlOrJson(projection.includeResponseFields[0]);
    }

    if (projection.excludeResponseFields?.[0]?.includes('{')) {
      projection.excludeResponseFields = getFieldsFromGraphQlOrJson(projection.excludeResponseFields[0]);
    }

    if (projection.includeResponseFields) {
      const fields: string[] = [];
      projection.includeResponseFields.forEach((includeResponseField) => {
        this.getFieldsForEntity(
          fields,
          entityClass as any,
          Types,
          { includeResponseFields: [includeResponseField] },
          ''
        );

        if (fields.length === 0) {
          throw new Error('Invalid field: ' + includeResponseField + ' in includeResponseFields');
        }
      });
    }

    if (projection.excludeResponseFields) {
      const fields: string[] = [];
      projection.excludeResponseFields.forEach((excludeResponseField) => {
        this.getFieldsForEntity(
          fields,
          entityClass as any,
          Types,
          { includeResponseFields: [excludeResponseField] },
          ''
        );

        if (fields.length === 0) {
          throw new Error('Invalid field: ' + excludeResponseField + ' in excludeResponseFields');
        }
      });
    }

    this.getFieldsForEntity(fields, entityClass as any, Types, projection, '');
    return fields.join(', ');
  }

  private getFieldsForEntity(
    fields: string[],
    entityClass: Function,
    Types: object,
    projection: OptionalProjection,
    fieldPath: string
  ) {
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
        const relationEntityName = baseFieldTypeName;
        this.getFieldsForEntity(
          fields,
          (Types as any)[relationEntityName],
          Types,
          projection,
          fieldPath + fieldName + '.'
        );
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = baseFieldTypeName;
        this.getFieldsForEntity(
          fields,
          (Types as any)[relationEntityName],
          Types,
          projection,
          fieldPath + fieldName + '.'
        );
      } else if (isArray) {
        if (this.shouldIncludeField(fieldName, fieldPath, projection)) {
          const relationEntityName = entityClass.name + fieldName.slice(0, -1);
          const idFieldName = entityClass.name.charAt(0).toLowerCase() + entityClass.name.slice(1) + 'Id';
          fields.push(
            `${this.schema}.${relationEntityName}.${idFieldName} AS ${relationEntityName}_${idFieldName}`
          );

          const singularFieldName = fieldName.slice(0, -1);

          fields.push(
            `${this.schema}.${relationEntityName}.${singularFieldName} AS ${relationEntityName}_${singularFieldName}`
          );
        }
      } else {
        if (this.shouldIncludeField(fieldName, fieldPath, projection)) {
          if (fieldName === '_id' || fieldName === 'id' || fieldName.endsWith('Id')) {
            fields.push(
              `CAST(${this.schema}.${entityClass.name}.${fieldName} AS VARCHAR) AS ${entityClass.name}_${fieldName}`
            );
          } else {
            fields.push(
              `${this.schema}.${entityClass.name}.${fieldName} AS ${entityClass.name}_${fieldName}`
            );
          }
        }
      }
    });
  }

  private shouldIncludeField(
    fieldName: string,
    fieldPath: string,
    { includeResponseFields, excludeResponseFields }: OptionalProjection
  ) {
    let shouldIncludeField = true;
    const fullFieldPath = fieldPath + fieldName;

    if (includeResponseFields && includeResponseFields.length > 0) {
      shouldIncludeField = !!includeResponseFields.find((includeResponseField) =>
        fullFieldPath.length >= includeResponseField.length && fullFieldPath.includes('.')
          ? includeResponseField === fullFieldPath.slice(0, includeResponseField.length)
          : includeResponseField === fullFieldPath
      );
    }

    if (excludeResponseFields && excludeResponseFields.length > 0) {
      const shouldExcludeField = !!excludeResponseFields.find(
        (excludeResponseField) => excludeResponseField === fullFieldPath.slice(0, excludeResponseField.length)
      );

      shouldIncludeField = shouldExcludeField ? false : shouldIncludeField;
    }

    return shouldIncludeField;
  }

  private tryGetWhereStatement<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: Function,
    Types: object
  ) {
    let filtersSql: string;

    if (Array.isArray(filters)) {
      filtersSql = filters
        .filter((sqlExpression) => sqlExpression.hasValues())
        .map((sqlExpression) => sqlExpression.toSqlString(this.schema, entityClass.name))
        .join(' AND ');
    } else {
      filtersSql = Object.entries(filters)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([fieldName]) => `{{${fieldName}}} = :${fieldName}`)
        .join(' AND ');
    }

    const fieldNameTemplates = filtersSql.match(/{{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*}}/g);
    (fieldNameTemplates ?? []).forEach((fieldNameTemplate) => {
      const fieldName = fieldNameTemplate
        .split('{{')[1]
        .split('}}')[0]
        .trim();

      let projection;
      try {
        projection = this.tryGetProjection({ includeResponseFields: [fieldName] }, entityClass, Types);
      } catch (error) {
        throw new Error('Invalid filter field: ' + fieldName);
      }

      const sqlColumn = this.getSqlColumnFromProjection(projection);
      filtersSql = filtersSql.replace(new RegExp(fieldNameTemplate, 'g'), sqlColumn);
    });

    return filtersSql ? `WHERE ${filtersSql}` : '';
  }

  private getFilterValues<T>(filters: Partial<T> | SqlExpression[]) {
    if (Array.isArray(filters)) {
      return filters.reduce(
        (filterValues, sqlExpression) => ({ ...filterValues, ...sqlExpression.getValues() }),
        {}
      );
    }

    return filters;
  }

  private getJoinStatement(entityClass: Function, Types: object) {
    let joinStatement = '';

    if (entityContainer.entityNameToJoinsMap[entityClass.name]) {
      entityContainer.entityNameToJoinsMap[entityClass.name].forEach((joinSpec, index) => {
        if (index !== 0) {
          joinStatement += ' ';
        }

        joinStatement += 'LEFT JOIN ';
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
        const relationEntityName = baseFieldTypeName;
        joinStatement += this.getJoinStatement((Types as any)[relationEntityName], Types);
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = baseFieldTypeName;
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
        const relationEntityName = baseFieldTypeName;
        this.transformResult(result[fieldName], (Types as any)[relationEntityName], Types);
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        const relationEntityName = baseFieldTypeName;
        this.transformResult(result[fieldName], (Types as any)[relationEntityName], Types);
      } else if (isArray && result[fieldName]) {
        const singularFieldName = fieldName.slice(0, -1);
        result[fieldName] = result[fieldName].map((obj: any) => obj[singularFieldName]);
      }
    });
  }

  private createResultMaps(entityClass: Function, Types: object, projection: OptionalProjection) {
    const resultMaps: any[] = [];
    this.updateResultMaps(entityClass, Types, resultMaps, projection, '');
    return resultMaps;
  }

  private updateResultMaps(
    entityClassOrName: Function | string,
    Types: object,
    resultMaps: any[],
    projection: OptionalProjection,
    fieldPath: string,
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
        if (this.shouldIncludeField(fieldName, fieldPath, projection)) {
          const relationEntityName = baseFieldTypeName;

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
            fieldPath + fieldName + '.',
            {},
            entityClassOrName as Function
          );
        }
      } else if (
        baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() &&
        baseFieldTypeName[0] !== '('
      ) {
        if (this.shouldIncludeField(fieldName, fieldPath, projection)) {
          const relationEntityName = baseFieldTypeName;

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
            fieldPath + fieldName + '.',
            {},
            entityClassOrName as Function
          );
        }
      } else if (isArray) {
        if (this.shouldIncludeField(fieldName, fieldPath, projection)) {
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
            fieldPath + fieldName + '.',
            {
              [fieldName.slice(0, -1)]: 'integer'
            },
            entityClassOrName as Function
          );
        }
      } else {
        if (fieldName !== idFieldName && ((!parentEntityClass && fieldName !== '_id') || parentEntityClass)) {
          if (this.shouldIncludeField(fieldName, fieldPath, projection)) {
            resultMap.properties.push({ name: fieldName, column: fieldName.toLowerCase() });
          }
        }
      }
    });

    resultMaps.push(resultMap);
  }

  private getSqlColumnFromProjection(projection: string) {
    const leftSideOfAs = projection.split(' AS ')[0];
    if (leftSideOfAs.startsWith('CAST(')) {
      return leftSideOfAs.slice(5);
    }
    return leftSideOfAs;
  }
}
