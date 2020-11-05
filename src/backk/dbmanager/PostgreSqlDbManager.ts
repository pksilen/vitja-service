import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { Pool, QueryConfig, QueryResult, types } from 'pg';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import isErrorResponse from '../errors/isErrorResponse';
import createEntity from './sql/operations/dml/createEntity';
import addSubEntity from './sql/operations/dml/addSubEntity';
import getEntities from './sql/operations/dql/getEntities';
import getEntitiesCount from './sql/operations/dql/getEntitiesCount';
import getEntityById from './sql/operations/dql/getEntityById';
import getSubEntity from './sql/operations/dql/getSubEntity';
import getEntityBy from './sql/operations/dql/getEntityBy';
import getEntitiesBy from './sql/operations/dql/getEntitiesBy';
import updateEntity from './sql/operations/dml/updateEntity';
import deleteEntityById from './sql/operations/dml/deleteEntityById';
import removeSubEntities from './sql/operations/dml/removeSubEntities';
import deleteAllEntities from './sql/operations/dml/deleteAllEntities';
import getEntitiesByIds from './sql/operations/dql/getEntitiesByIds';
import { ErrorResponse } from '../types/ErrorResponse';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { Entity } from '../types/Entity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import log from '../observability/logging/log';

@Injectable()
export default class PostgreSqlDbManager extends AbstractDbManager {
  private pool: Pool;
  private firstDbOperationFailureTimeInMillis = 0;

  constructor(
    private readonly host: string,
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

  getDbManagerType(): string {
    return 'PostgreSQL';
  }

  getDbHost(): string {
    return this.host;
  }

  async tryExecute<T>(dbOperationFunction: (pool: Pool) => Promise<T>): Promise<T> {
    throw new Error('Not implemented');
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

  async tryReserveDbConnectionFromPool(): Promise<void> {
    log('DEBUG', 'Acquire database connection', '');

    try {
      this.getClsNamespace()?.set('connection', await this.pool.connect());
      this.getClsNamespace()?.set('localTransaction', false);
      this.getClsNamespace()?.set('globalTransaction', false);
      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.host, 0);
      }
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.host,
          failureDurationInSecs
        );
      }
      throw error;
    }
  }

  tryReleaseDbConnectionBackToPool() {
    log('DEBUG', 'Release database connection', '');

    this.getClsNamespace()
      ?.get('connection')
      .release();
    this.getClsNamespace()?.set('connection', null);
  }

  async tryBeginTransaction(): Promise<void> {
    log('DEBUG', 'Begin database transaction', '');

    try {
      await this.getClsNamespace()
        ?.get('connection')
        .query('BEGIN');
      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.host, 0);
      }
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.host,
          failureDurationInSecs
        );
      }
      throw error;
    }
  }

  async tryCommitTransaction(): Promise<void> {
    log('DEBUG', 'Commit database transaction', '');

    await this.getClsNamespace()
      ?.get('connection')
      .query('COMMIT');
  }

  async tryRollbackTransaction(): Promise<void> {
    log('DEBUG', 'Rollback database transaction', '');

    await this.getClsNamespace()
      ?.get('connection')
      .query('ROLLBACK');
  }

  async tryExecuteSql<T>(sqlStatement: string, values?: any[]): Promise<Field[]> {
    log('DEBUG', 'Database DML operation', sqlStatement);

    try {
      const result = await this.getClsNamespace()
        ?.get('connection')
        .query(sqlStatement, values);

      return result.fields;
    } catch (error) {
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.host);
      throw error;
    }
  }

  async tryExecuteSqlWithoutCls<T>(sqlStatement: string, values?: any[]): Promise<Field[]> {
    log('DEBUG', 'Database DDL operation', sqlStatement);

    try {
      const result = await this.pool.query(sqlStatement, values);
      return result.fields;
    } catch (error) {
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.host);
      throw error;
    }
  }

  async tryExecuteQuery(sqlStatement: string, values?: any[]): Promise<QueryResult<any>> {
    log('DEBUG', 'Database DQL operation', sqlStatement);

    try {
      const response = await this.getClsNamespace()
        ?.get('connection')
        .query(sqlStatement, values);

      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.host, 0);
      }

      return response;
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.host,
          failureDurationInSecs
        );
      }
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.host);
      throw error;
    }
  }

  async tryExecuteQueryWithConfig(queryConfig: QueryConfig): Promise<QueryResult<any>> {
    log('DEBUG', 'Database DQL operation', queryConfig.text);

    try {
      const response = await this.getClsNamespace()
        ?.get('connection')
        .query(queryConfig);

      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.host, 0);
      }

      return response;
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.host,
          failureDurationInSecs
        );
      }
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.host);
      throw error;
    }
  }

  async executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse> {
    try {
      await this.tryBeginTransaction();
      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.host, 0);
      }
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.host,
          failureDurationInSecs
        );
      }
      return createErrorResponseFromError(error);
    }
    this.getClsNamespace()?.set('globalTransaction', true);

    const result = await executable();

    if (isErrorResponse(result)) {
      try {
        await this.tryRollbackTransaction();
      } catch (error) {
        return createErrorResponseFromError(error);
      }
    } else {
      try {
        await this.tryCommitTransaction();
      } catch (error) {
        return createErrorResponseFromError(error);
      }
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
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.createEntity');

    const dbOperationStartTimeInMillis = Date.now();

    const response = createEntity(
      this,
      entity,
      entityClass,
      preHooks,
      postQueryOperations,
      false,
      shouldReturnItem
    );

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async addSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.addSubEntity');
    const dbOperationStartTimeInMillis = Date.now();

    const response = addSubEntity(
      this,
      _id,
      subEntitiesPath,
      newSubEntity,
      entityClass,
      subEntityClass,
      preHooks,
      postQueryOperations
    );

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getEntities<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getEntities');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getEntities(this, filters, entityClass, postQueryOperations);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getEntitiesCount<T>(
    filters: Partial<T> | SqlExpression[] | undefined,
    entityClass: new () => T
  ): Promise<number | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getEntitiesCount');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getEntitiesCount(this, filters, entityClass);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getEntityById<T>(
    _id: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getEntityById');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getEntityById(this, _id, entityClass, postQueryOperations);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getSubEntity<T extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<any | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getSubEntity');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getSubEntity(this, _id, subEntityPath, entityClass, postQueryOperations);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getEntitiesByIds');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getEntitiesByIds(this, _ids, entityClass, postQueryOperations);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getEntityBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getEntityBy');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getEntityBy(this, fieldName, fieldValue, entityClass, postQueryOperations);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async getEntitiesBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.getEntitiesBy');
    const dbOperationStartTimeInMillis = Date.now();

    const response = getEntitiesBy(this, fieldName, fieldValue, entityClass, postQueryOperations);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async updateEntity<T extends Entity>(
    entity: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    shouldCheckIfItemExists: boolean = true
  ): Promise<void | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.updateEntity');
    const dbOperationStartTimeInMillis = Date.now();

    const response = updateEntity(this, entity, entityClass, preHooks, shouldCheckIfItemExists);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.deleteEntityById');
    const dbOperationStartTimeInMillis = Date.now();

    const response = deleteEntityById(this, _id, entityClass, preHooks);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async removeSubEntities<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.removeSubEntities');
    const dbOperationStartTimeInMillis = Date.now();

    const response = removeSubEntities(this, _id, subEntitiesPath, entityClass, preHooks);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  removeSubEntityById<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    subEntityId: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.removeSubEntityById');
    const dbOperationStartTimeInMillis = Date.now();

    const subEntityPath = `${subEntitiesPath}[?(@.id == '${subEntityId}')]`;
    const response = this.removeSubEntities(_id, subEntityPath, entityClass, preHooks);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }

  async deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    log('DEBUG', 'Database manager operation', 'PostgreSqlDbManager.deleteAllEntities');
    const dbOperationStartTimeInMillis = Date.now();

    const response = deleteAllEntities(this, entityClass);

    const dbOperationProcessingTimeInMillis = Date.now() - dbOperationStartTimeInMillis;
    defaultServiceMetrics.incrementDbOperationProcessingTimeInSecsBucketCounterByOne(
      this.getDbManagerType(),
      this.host,
      dbOperationProcessingTimeInMillis / 1000
    );
    return response;
  }
}
