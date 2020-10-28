import { Injectable } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Pool, QueryConfig, QueryResult, types } from "pg";
import SqlExpression from "./sql/expressions/SqlExpression";
import AbstractDbManager, { Field } from "./AbstractDbManager";
import isErrorResponse from "../errors/isErrorResponse";
import createEntity from "./sql/operations/dml/createEntity";
import createSubEntity from "./sql/operations/dml/createSubEntity";
import getEntities from "./sql/operations/dml/getEntities";
import getEntitiesCount from "./sql/operations/dml/getEntitiesCount";
import getEntityById from "./sql/operations/dml/getEntityById";
import getSubEntity from "./sql/operations/dml/getSubEntity";
import getEntityBy from "./sql/operations/dml/getEntityBy";
import getEntitiesBy from "./sql/operations/dml/getEntitiesBy";
import updateEntity from "./sql/operations/dml/updateEntity";
import deleteEntityById from "./sql/operations/dml/deleteEntityById";
import deleteSubEntities from "./sql/operations/dml/deleteSubEntities";
import deleteAllEntities from "./sql/operations/dml/deleteAllEntities";
import getEntitiesByIds from "./sql/operations/dml/getEntitiesByIds";
import { ErrorResponse } from "../types/ErrorResponse";
import { RecursivePartial } from "../types/RecursivePartial";
import { PreHook } from "./hooks/PreHook";
import { Entity } from "../types/Entity";
import { PostQueryOperations } from "../types/postqueryoperations/PostQueryOperations";

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
    entity: Omit<T, '_id'>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations,
    shouldReturnItem = true
  ): Promise<T | ErrorResponse> {
    return createEntity(this, entity, entityClass, preHooks, postQueryOperations,false, shouldReturnItem);
  }

  async createSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    return createSubEntity(this, _id, subEntitiesPath, newSubEntity, entityClass, subEntityClass, postQueryOperations);
  }

  async getEntities<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    return getEntities(this, filters, entityClass, postQueryOperations);
  }

  async getEntitiesCount<T>(
    filters: Partial<T> | SqlExpression[] | undefined,
    entityClass: new () => T
  ): Promise<number | ErrorResponse> {
    return getEntitiesCount(this, filters, entityClass);
  }

  async getEntityById<T>(
    _id: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    return getEntityById(this, _id, entityClass, postQueryOperations);
  }

  async getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<U | ErrorResponse> {
    return getSubEntity(this, _id, subEntityPath, entityClass, postQueryOperations);
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    return getEntitiesByIds(this, _ids, entityClass, postQueryOperations);
  }

  async getEntityBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    return getEntityBy(this, fieldName, fieldValue, entityClass, postQueryOperations);
  }

  async getEntitiesBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    return getEntitiesBy(this, fieldName, fieldValue, entityClass, postQueryOperations);
  }

  async updateEntity<T extends Entity>(
    entity: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    shouldCheckIfItemExists: boolean = true
  ): Promise<void | ErrorResponse> {
    return updateEntity(this, entity, entityClass, preHooks, shouldCheckIfItemExists);
  }

  async deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return deleteEntityById(this, _id, entityClass, preHooks);
  }

  async deleteSubEntities<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return deleteSubEntities(this, _id, subEntitiesPath, entityClass, preHooks);
  }

  async deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    return deleteAllEntities(this, entityClass);
  }
}
