import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import isErrorResponse from '../errors/isErrorResponse';
import createEntity from './sql/operations/dml/createEntity';
import getEntitiesByFilters from './sql/operations/dql/getEntitiesByFilters';
import getEntitiesCount from './sql/operations/dql/getEntitiesCount';
import getEntityById from './sql/operations/dql/getEntityById';
import getEntityWhere from './sql/operations/dql/getEntityWhere';
import getEntitiesWhere from './sql/operations/dql/getEntitiesWhere';
import updateEntity from './sql/operations/dml/updateEntity';
import deleteEntityById from './sql/operations/dml/deleteEntityById';
import removeSubEntities from './sql/operations/dml/removeSubEntities';
import deleteAllEntities from './sql/operations/dml/deleteAllEntities';
import getEntitiesByIds from './sql/operations/dql/getEntitiesByIds';
import { ErrorResponse } from '../types/ErrorResponse';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { Entity } from '../types/entities/Entity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import log, { Severity } from '../observability/logging/log';
import addSubEntities from './sql/operations/dml/addSubEntities';
import getSubEntities from './sql/operations/dql/getSubEntities';
import startDbOperation from './utils/startDbOperation';
import recordDbOperationDuration from './utils/recordDbOperationDuration';
import deleteEntitiesWhere from './sql/operations/dml/deleteEntitiesWhere';
import { getNamespace } from 'cls-hooked';
import UserDefinedFilter from '../types/userdefinedfilters/UserDefinedFilter';
import updateEntityWhere from './sql/operations/dml/updateEntityWhere';
import getAllEntities from './sql/operations/dql/getAllEntities';
import { SubEntity } from '../types/entities/SubEntity';
import deleteEntitiesByFilters from './sql/operations/dml/deleteEntitiesByFilters';
import MongoDbQuery from './mongodb/MongoDbQuery';

@Injectable()
export default abstract class AbstractSqlDbManager extends AbstractDbManager {
  getClient(): any {
    return undefined;
  }

  cleanupTransaction() {
    // No operation
  }

  abstract getDbHost(): string;

  abstract getPool(): any;

  abstract getConnection(): Promise<any>;

  abstract releaseConnection(connection: any): void;

  abstract getResultRows(result: any): any[];

  abstract getResultFields(result: any): any[];

  abstract getValuePlaceholder(index: number): string;

  abstract getReturningIdClause(): string;

  abstract getBeginTransactionStatement(): string;

  abstract getInsertId(result: any): number;

  abstract getIdColumnCastType(): string;

  abstract executeSql(connection: any, sqlStatement: string, values?: any[]): Promise<any>;

  abstract executeSqlWithNamedPlaceholders(
    connection: any,
    sqlStatement: string,
    values: object
  ): Promise<any>;

  async isDbReady(): Promise<boolean> {
    try {
      await this.tryExecuteSqlWithoutCls(
        `SELECT * FROM ${this.schema.toLowerCase()}.__backk__`,
        undefined,
        false
      );
      return true;
    } catch (error) {
      try {
        const createTableStatement = `CREATE TABLE ${this.schema.toLowerCase()}.__backk__ (dummy INT)`;
        await this.tryExecuteSqlWithoutCls(createTableStatement);
        return true;
      } catch (error) {
        return false;
      }
    }
  }

  async tryReserveDbConnectionFromPool(): Promise<void> {
    if (getNamespace('multipleServiceFunctionExecutions')?.get('connection')) {
      return;
    }

    log(Severity.DEBUG, 'Acquire database connection', '');

    try {
      const connection = await this.getConnection();
      this.getClsNamespace()?.set('connection', connection);
      this.getClsNamespace()?.set('localTransaction', false);
      this.getClsNamespace()?.set('globalTransaction', false);
      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.getDbHost(), 0);
      }
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.getDbHost(),
          failureDurationInSecs
        );
      }
      log(Severity.ERROR, error.message, error.stack ?? '', {
        function: `${this.constructor.name}.tryReserveDbConnectionFromPool`
      });
      throw error;
    }
  }

  tryReleaseDbConnectionBackToPool() {
    if (getNamespace('multipleServiceFunctionExecutions')?.get('connection')) {
      return;
    }

    log(Severity.DEBUG, 'Release database connection', '');

    try {
      this.releaseConnection(this.getClsNamespace()?.get('connection'));
    } catch (error) {
      log(Severity.ERROR, error.message, error.stack ?? '', {
        function: `${this.constructor.name}.tryReleaseDbConnectionBackToPool`
      });
      throw error;
    }

    this.getClsNamespace()?.set('connection', null);
  }

  async tryBeginTransaction(): Promise<void> {
    log(Severity.DEBUG, 'Begin database transaction', '');

    try {
      await this.getClsNamespace()
        ?.get('connection')
        .query(this.getBeginTransactionStatement());
      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.getDbHost(), 0);
      }
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.getDbHost(),
          failureDurationInSecs
        );
      }
      log(Severity.ERROR, error.message, error.stack ?? '', {
        function: `${this.constructor.name}.tryBeginTransaction`,
        sqlStatement: 'BEGIN'
      });
      throw error;
    }
  }

  async tryCommitTransaction(): Promise<void> {
    log(Severity.DEBUG, 'Commit database transaction', '');

    try {
      await this.getClsNamespace()
        ?.get('connection')
        .query('COMMIT');
    } catch (error) {
      log(Severity.ERROR, error.message, error.stack ?? '', {
        function: `${this.constructor.name}.tryCommitTransaction`,
        sqlStatement: 'COMMIT'
      });
      throw error;
    }
  }

  async tryRollbackTransaction(): Promise<void> {
    log(Severity.DEBUG, 'Rollback database transaction', '');

    try {
      await this.getClsNamespace()
        ?.get('connection')
        .query('ROLLBACK');
    } catch (error) {
      log(Severity.ERROR, error.message, error.stack ?? '', {
        function: `${this.constructor.name}.tryRollbackTransaction`,
        sqlStatement: 'ROLLBACK'
      });
    }
  }

  async tryExecuteSql<T>(sqlStatement: string, values?: any[]): Promise<Field[]> {
    if (this.getClsNamespace()?.get('remoteServiceCallCount') > 0) {
      this.getClsNamespace()?.set('dbManagerOperationAfterRemoteServiceCall', true);
    }

    log(Severity.DEBUG, 'Database DML operation', sqlStatement);

    try {
      const result = await this.executeSql(this.getClsNamespace()?.get('connection'), sqlStatement, values);
      return this.getResultFields(result);
    } catch (error) {
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.getDbHost());
      log(Severity.ERROR, error.message, error.stack ?? '', {
        sqlStatement,
        function: `${this.constructor.name}.tryExecuteSql`
      });
      throw error;
    }
  }

  async tryExecuteSqlWithoutCls<T>(
    sqlStatement: string,
    values?: any[],
    shouldReportError = true
  ): Promise<Field[]> {
    log(Severity.DEBUG, 'Database DDL operation', sqlStatement);

    try {
      const result = await this.getPool().query(sqlStatement, values);
      if (sqlStatement.startsWith('CREATE') || sqlStatement.startsWith('ALTER')) {
        log(Severity.INFO, 'Database initialization operation', '', {
          sqlStatement,
          function: `${this.constructor.name}.tryExecuteSqlWithoutCls`
        });
      }
      return this.getResultFields(result);
    } catch (error) {
      if (shouldReportError) {
        defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.getDbHost());
        log(Severity.ERROR, error.message, error.stack ?? '', {
          sqlStatement,
          function: `${this.constructor.name}.tryExecuteSqlWithoutCls`
        });
      }
      throw error;
    }
  }

  async tryExecuteQuery(sqlStatement: string, values?: any[]): Promise<any> {
    if (this.getClsNamespace()?.get('remoteServiceCallCount') > 0) {
      this.getClsNamespace()?.set('dbManagerOperationAfterRemoteServiceCall', true);
    }

    log(Severity.DEBUG, 'Database DQL operation', sqlStatement);

    try {
      const response = await this.executeSql(this.getClsNamespace()?.get('connection'), sqlStatement, values);

      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.getDbHost(), 0);
      }

      return response;
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.getDbHost(),
          failureDurationInSecs
        );
      }
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.getDbHost());
      log(Severity.ERROR, error.message, error.stack ?? '', {
        sqlStatement,
        function: `${this.constructor.name}.tryExecuteQuery`
      });
      throw error;
    }
  }

  async tryExecuteQueryWithNamedParameters(sqlStatement: string, values: object): Promise<any> {
    if (this.getClsNamespace()?.get('remoteServiceCallCount') > 0) {
      this.getClsNamespace()?.set('dbManagerOperationAfterRemoteServiceCall', true);
    }

    log(Severity.DEBUG, 'Database DQL operation', sqlStatement);

    try {
      const response = await this.executeSqlWithNamedPlaceholders(
        this.getClsNamespace()?.get('connection'),
        sqlStatement,
        values
      );

      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.getDbHost(), 0);
      }

      return response;
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.getDbHost(),
          failureDurationInSecs
        );
      }
      defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.getDbHost());
      log(Severity.ERROR, error.message, error.stack ?? '', {
        sqlStatement,
        function: `${this.constructor.name}.tryExecuteQueryWithNamedParameters`
      });
      throw error;
    }
  }

  async executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse> {
    if (getNamespace('multipleServiceFunctionExecutions')?.get('globalTransaction')) {
      return await executable();
    }

    this.getClsNamespace()?.set('globalTransaction', true);

    try {
      await this.tryBeginTransaction();
      if (this.firstDbOperationFailureTimeInMillis) {
        this.firstDbOperationFailureTimeInMillis = 0;
        defaultServiceMetrics.recordDbFailureDurationInSecs(this.getDbManagerType(), this.getDbHost(), 0);
      }
    } catch (error) {
      if (this.firstDbOperationFailureTimeInMillis) {
        const failureDurationInSecs = (Date.now() - this.firstDbOperationFailureTimeInMillis) / 1000;
        defaultServiceMetrics.recordDbFailureDurationInSecs(
          this.getDbManagerType(),
          this.getDbHost(),
          failureDurationInSecs
        );
      }
      return createErrorResponseFromError(error);
    }

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
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations,
    shouldReturnItem = true
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'createEntity');

    const response = createEntity(
      this,
      entity,
      entityClass,
      preHooks,
      postQueryOperations,
      false,
      shouldReturnItem
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async addSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'> | { _id: string },
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntity');

    const response = addSubEntities(
      this,
      _id,
      subEntitiesPath,
      [newSubEntity],
      entityClass,
      subEntityClass,
      preHooks,
      postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async addSubEntities<T extends Entity, U extends SubEntity>(
    _id: string,
    subEntitiesPath: string,
    newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntities');

    const response = addSubEntities(
      this,
      _id,
      subEntitiesPath,
      newSubEntities,
      entityClass,
      subEntityClass,
      preHooks,
      postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getAllEntities<T>(
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByFilters');
    const response = getAllEntities(this, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object,
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByFilters');
    const response = getEntitiesByFilters(this, filters, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object | undefined,
    entityClass: new () => T
  ): Promise<number | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesCount');
    const response = getEntitiesCount(this, filters, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntityById<T>(
    _id: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityById');
    const response = getEntityById(this, _id, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getSubEntity<T extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<any | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntity');
    const response = getSubEntities(this, _id, subEntityPath, entityClass, postQueryOperations, 'first');
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getSubEntities<T extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<any | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntities');
    const response = getSubEntities(this, _id, subEntityPath, entityClass, postQueryOperations, 'all');
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByIds');
    const response = getEntitiesByIds(this, _ids, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityWhere');
    const response = getEntityWhere(this, fieldPathName, fieldValue, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesWhere');
    const response = getEntitiesWhere(this, fieldPathName, fieldValue, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async updateEntity<T extends Entity>(
    entity: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    allowAdditionAndRemovalForSubEntityClasses: (new () => any)[] | 'all',
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntity');
    const response = updateEntity(
      this,
      entity,
      entityClass,
      allowAdditionAndRemovalForSubEntityClasses,
      preHooks
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  updateEntityWhere<T extends Entity>(
    fieldPathName: string,
    fieldValue: T[keyof T],
    entity: RecursivePartial<T>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntitiesBy');
    const response = updateEntityWhere(
      this,
      fieldPathName,
      fieldValue,
      entity,
      entityClass,
      preHooks
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntityById');
    const response = deleteEntityById(this, _id, entityClass, preHooks);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  deleteEntitiesWhere<T extends object>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntitiesWhere');
    const response = deleteEntitiesWhere(this, fieldName, fieldValue, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  deleteEntitiesByFilters<T extends object>(
    filters: Array<MongoDbQuery<T>> | SqlExpression[] | UserDefinedFilter[],
    entityClass: new () => T
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntitiesByFilters');
    const response = deleteEntitiesByFilters(this, filters, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async removeSubEntities<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntities');
    const response = removeSubEntities(this, _id, subEntitiesPath, entityClass, preHooks);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  removeSubEntityById<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    subEntityId: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntityById');
    const subEntityPath = `${subEntitiesPath}[?(@.id == '${subEntityId}' || @._id == '${subEntityId}')]`;
    const response = this.removeSubEntities(_id, subEntityPath, entityClass, preHooks);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteAllEntities');
    const response = deleteAllEntities(this, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }
}
