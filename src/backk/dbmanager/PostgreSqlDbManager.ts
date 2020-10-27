import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Pool, QueryConfig, QueryResult, types } from 'pg';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field} from "./AbstractDbManager";
import isErrorResponse from '../errors/isErrorResponse';
import createEntity from './sql/operations/dml/createEntity';
import createSubEntity from './sql/operations/dml/createSubEntity';
import getEntities from './sql/operations/dml/getEntities';
import getEntitiesCount from './sql/operations/dml/getEntitiesCount';
import getEntityById from './sql/operations/dml/getEntityById';
import getSubEntity from './sql/operations/dml/getSubEntity';
import getEntitiesByIds from './sql/operations/dml/getItemsById';
import getEntityBy from './sql/operations/dml/getEntityBy';
import getEntitiesBy from './sql/operations/dml/getEntitiesBy';
import updateEntity from './sql/operations/dml/updateEntity';
import deleteEntityById from './sql/operations/dml/deleteEntityById';
import deleteSubEntities from './sql/operations/dml/deleteSubEntities';
import deleteAllEntities from './sql/operations/dml/deleteAllEntities';
import { ErrorResponse } from '../types/ErrorResponse';
import { PostQueryOps } from '../types/PostQueryOps';
import OptPostQueryOps from '../types/OptPostQueryOps';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from "./hooks/PreHook";

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

  async createEntity<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object,
    preHooks?: PreHook | PreHook[],
    shouldReturnItem = true
  ): Promise<T | ErrorResponse> {
    return createEntity(
      this,
      item,
      entityClass,
      Types,
      preHooks,
      false,
      shouldReturnItem
    );
  }

  async createSubEntity<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    newSubItem: Omit<U, 'id'>,
    entityClass: new () => T,
    subItemEntityClass: new () => U,
    Types: object
  ): Promise<T | ErrorResponse> {
    return createSubEntity(this, _id, subItemsPath, newSubItem, entityClass, subItemEntityClass, Types);
  }

  async getEntities<T>(
    filters: Partial<T> | SqlExpression[],
    postQueryOps: PostQueryOps,
    entityClass: new () => T,
    Types: object
  ): Promise<T[] | ErrorResponse> {
    return getEntities(this, filters, postQueryOps, entityClass, Types);
  }

  async getEntitiesCount<T>(
    filters: Partial<T> | SqlExpression[] | undefined,
    entityClass: new () => T,
    Types: object
  ): Promise<number | ErrorResponse> {
    return getEntitiesCount(this, filters, entityClass, Types);
  }

  async getEntityById<T>(_id: string, entityClass: new () => T, Types: object): Promise<T | ErrorResponse> {
    return getEntityById(this, _id, entityClass, Types);
  }

  async getSubEntity<T extends object, U extends object>(
    _id: string,
    subItemPath: string,
    entityClass: new () => T,
    Types: object
  ): Promise<U | ErrorResponse> {
    return getSubEntity(this, _id, subItemPath, entityClass, Types);
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    Types: object,
    postQueryOps?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    return getEntitiesByIds(this, _ids, entityClass, Types, postQueryOps);
  }

  async getEntityBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object
  ): Promise<T | ErrorResponse> {
    return getEntityBy(this, fieldName, fieldValue, entityClass, Types);
  }

  async getEntitiesBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object,
    postQueryOps?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    return getEntitiesBy(this, fieldName, fieldValue, entityClass, Types);
  }

  async updateEntity<T extends object & { _id: string; id?: string }>(
    item: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    Types: object,
    preHooks?: PreHook | PreHook[],
    shouldCheckIfItemExists: boolean = true
  ): Promise<void | ErrorResponse> {
    return updateEntity(this, item, entityClass, Types, preHooks, shouldCheckIfItemExists);
  }

  async deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    preHooks?: PreHook | PreHook[],
  ): Promise<void | ErrorResponse> {
    return deleteEntityById(this, _id, entityClass, Types, preHooks);
  }

  async deleteSubEntities<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    entityClass: new () => T,
    Types: object,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return deleteSubEntities(this, _id, subItemsPath, entityClass, Types, preHooks);
  }

  async deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    return deleteAllEntities(this, entityClass);
  }
}
