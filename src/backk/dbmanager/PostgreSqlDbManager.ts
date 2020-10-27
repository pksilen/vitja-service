import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Pool, QueryConfig, QueryResult, types } from 'pg';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field, PreHook } from "./AbstractDbManager";
import isErrorResponse from '../errors/isErrorResponse';
import createItem from './sql/operations/dml/createItem';
import createSubItem from './sql/operations/dml/createSubItem';
import getItems from './sql/operations/dml/getItems';
import getItemsCount from './sql/operations/dml/getItemsCount';
import getItemById from './sql/operations/dml/getItemById';
import getSubItem from './sql/operations/dml/getSubItem';
import getItemsByIds from './sql/operations/dml/getItemsById';
import getItemBy from './sql/operations/dml/getItemBy';
import getItemsBy from './sql/operations/dml/getItemsBy';
import updateItem from './sql/operations/dml/updateItem';
import deleteItemById from './sql/operations/dml/deleteItemById';
import deleteSubItems from './sql/operations/dml/deleteSubItems';
import deleteAllItems from './sql/operations/dml/deleteAllItems';
import { ErrorResponse } from '../types/ErrorResponse';
import { PostQueryOps } from '../types/PostQueryOps';
import OptPostQueryOps from '../types/OptPostQueryOps';
import { RecursivePartial } from '../types/RecursivePartial';

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
    preHooks?: PreHook | PreHook[],
    shouldReturnItem = true
  ): Promise<T | ErrorResponse> {
    return createItem(
      this,
      item,
      entityClass,
      Types,
      preHooks,
      false,
      shouldReturnItem
    );
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
    preHooks?: PreHook | PreHook[],
    shouldCheckIfItemExists: boolean = true
  ): Promise<void | ErrorResponse> {
    return updateItem(this, item, entityClass, Types, preHooks, shouldCheckIfItemExists);
  }

  async deleteItemById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    preHooks?: PreHook | PreHook[],
  ): Promise<void | ErrorResponse> {
    return deleteItemById(this, _id, entityClass, Types, preHooks);
  }

  async deleteSubItems<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    entityClass: new () => T,
    Types: object,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return deleteSubItems(this, _id, subItemsPath, entityClass, Types, preHooks);
  }

  async deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    return deleteAllItems(this, entityClass);
  }
}
