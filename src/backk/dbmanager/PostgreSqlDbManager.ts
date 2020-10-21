import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import joinjs from 'join-js';
import _ from 'lodash';
import { JSONPath } from 'jsonpath-plus';
import { Pool, QueryConfig, QueryResult, types } from 'pg';
import { pg } from 'yesql';
import entityContainer, { JoinSpec } from '../annotations/entity/entityAnnotationContainer';
import { ErrorResponse, OptPostQueryOps, PostQueryOps, RecursivePartial } from '../Backk';
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
import SqlExpression from '../sqlexpression/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import isErrorResponse from '../isErrorResponse';
import { plainToClass } from 'class-transformer';
import createItem from './sqloperations/createItem';
import createSubItem from './sqloperations/createSubItem';
import getItems from './sqloperations/getItems';
import getItemsCount from './sqloperations/getItemsCount';
import getItemById from './sqloperations/getItemById';
import getSubItem from './sqloperations/getSubItem';
import getItemsByIds from './sqloperations/getItemsById';
import getItemBy from './sqloperations/getItemBy';
import getItemsBy from './sqloperations/getItemsBy';
import updateItem from './sqloperations/updateItem';
import deleteItemById from './sqloperations/deleteItemById';
import deleteSubItems from './sqloperations/deleteSubItems';
import deleteAllItems from './sqloperations/deleteAllItems';

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
    itemCountQueryFilter?: Partial<T>
  ): Promise<T | ErrorResponse> {
    return createItem(this, item, entityClass, Types, maxAllowedItemCount, itemCountQueryFilter);
  }

  async createSubItem<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    newSubItem: Omit<U, 'id'>,
    entityClass: new () => T,
    subItemEntityClass: new () => U,
    Types: object
  ): Promise<T | ErrorResponse> {
    return createSubItem(this, _id, subItemsPath, newSubItem, entityClass, subItemEntityClass, Types);
  }

  async getItems<T>(
    filters: Partial<T> | SqlExpression[],
    postQueryOps: PostQueryOps,
    entityClass: new () => T,
    Types: object
  ): Promise<T[] | ErrorResponse> {
    return getItems(this, filters, postQueryOps, entityClass, Types);
  }

  async getItemsCount<T>(
    filters: Partial<T> | SqlExpression[] | undefined,
    entityClass: new () => T,
    Types: object
  ): Promise<number | ErrorResponse> {
    return getItemsCount(this, filters, entityClass, Types);
  }

  async getItemById<T>(_id: string, entityClass: new () => T, Types: object): Promise<T | ErrorResponse> {
    return getItemById(this, _id, entityClass, Types);
  }

  async getSubItem<T extends object, U extends object>(
    _id: string,
    subItemPath: string,
    entityClass: new () => T,
    Types: object
  ): Promise<U | ErrorResponse> {
    return getSubItem(this, _id, subItemPath, entityClass, Types);
  }

  async getItemsByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    Types: object,
    postQueryOps?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    return getItemsByIds(this, _ids, entityClass, Types, postQueryOps);
  }

  async getItemBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object
  ): Promise<T | ErrorResponse> {
    return getItemBy(this, fieldName, fieldValue, entityClass, Types);
  }

  async getItemsBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object,
    postQueryOps?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    return getItemsBy(this, fieldName, fieldValue, entityClass, Types);
  }

  async updateItem<T extends object & { _id: string; id?: string }>(
    item: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    Types: object,
    preCondition?: Partial<T> | string,
    shouldCheckIfItemExists: boolean = true
  ): Promise<void | ErrorResponse> {
    return updateItem(this, item, entityClass, Types, preCondition, shouldCheckIfItemExists);
  }

  async deleteItemById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    itemPreCondition?: Partial<T> | string
  ): Promise<void | ErrorResponse> {
    return deleteItemById(this, _id, entityClass, Types, itemPreCondition);
  }

  async deleteSubItems<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    entityClass: new () => T,
    Types: object,
    preCondition?: object | string
  ): Promise<void | ErrorResponse> {
    return deleteSubItems(this, _id, subItemsPath, entityClass, Types, preCondition);
  }

  async deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    return deleteAllItems(this, entityClass);
  }
}
