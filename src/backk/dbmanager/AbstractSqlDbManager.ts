import { Injectable } from '@nestjs/common';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
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
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { BackkEntity } from '../types/entities/BackkEntity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';
import createBackkErrorFromError from '../errors/createBackkErrorFromError';
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
import { PostHook } from './hooks/PostHook';
import DefaultPostQueryOperations from '../types/postqueryoperations/DefaultPostQueryOperations';
import createBackkErrorFromErrorCodeMessageAndStatus from '../errors/createBackkErrorFromErrorCodeMessageAndStatus';
import { BACKK_ERRORS } from '../errors/backkErrors';
import { CreatePreHook } from './hooks/CreatePreHook';
import { PromiseOfErrorOr } from '../types/PromiseOfErrorOr';
import updateEntitiesByFilters from './sql/operations/dml/updateEntitiesByFilters';

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

  abstract getAffectedRows(result: any): number;

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

  getFilters<T>(
    mongoDbFilters: Array<MongoDbQuery<T>> | Partial<T> | object,
    sqlFilters: SqlExpression[] | SqlExpression | Partial<T> | object
  ): Array<MongoDbQuery<T> | SqlExpression> | Partial<T> | object {
    return sqlFilters instanceof SqlExpression ? [sqlFilters] : sqlFilters;
  }

  async isDbReady(): Promise<boolean> {
    try {
      await this.tryExecuteSqlWithoutCls(
        `SELECT * FROM ${this.schema.toLowerCase()}.__backk_db_initialization`,
        undefined,
        false
      );

      return true;
    } catch (error) {
      try {
        const createTableStatement = `CREATE TABLE IF NOT EXISTS ${this.schema.toLowerCase()}.__backk_db_initialization (appversion VARCHAR(64) PRIMARY KEY NOT NULL UNIQUE, isinitialized ${this.getBooleanType()}, createdattimestamp ${this.getTimestampType()})`;
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

  async tryExecuteSql<T>(sqlStatement: string, values?: any[], shouldReportError = true): Promise<Field[]> {
    if (this.getClsNamespace()?.get('remoteServiceCallCount') > 0) {
      this.getClsNamespace()?.set('dbManagerOperationAfterRemoteServiceCall', true);
    }

    log(Severity.DEBUG, 'Database DML operation', sqlStatement);

    try {
      const result = await this.executeSql(this.getClsNamespace()?.get('connection'), sqlStatement, values);
      return this.getResultFields(result);
    } catch (error) {
      if (shouldReportError && !this.isDuplicateEntityError(error)) {
        defaultServiceMetrics.incrementDbOperationErrorsByOne(this.getDbManagerType(), this.getDbHost());

        log(Severity.ERROR, error.message, error.stack ?? '', {
          sqlStatement,
          function: `${this.constructor.name}.tryExecuteSql`
        });
      }

      throw error;
    }
  }

  async tryExecuteSqlWithoutCls<T>(
    sqlStatement: string,
    values?: any[],
    shouldReportError = true,
    shouldReportSuccess = true
  ): Promise<Field[]> {
    log(Severity.DEBUG, 'Database DDL operation', sqlStatement);

    try {
      const result = await this.getPool().query(sqlStatement, values);

      if (shouldReportSuccess && (sqlStatement.startsWith('CREATE') || sqlStatement.startsWith('ALTER'))) {
        log(Severity.INFO, 'Database initialization operation', '', {
          sqlStatement,
          function: `${this.constructor.name}.tryExecuteSqlWithoutCls`
        });
      }

      return this.getResultFields(result);
    } catch (error) {
      if (shouldReportError && !this.isDuplicateEntityError(error)) {
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
      if (!this.isDuplicateEntityError(error)) {
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
      }

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

  async executeInsideTransaction<T>(executable: () => PromiseOfErrorOr<T>): PromiseOfErrorOr<T> {
    if (getNamespace('multipleServiceFunctionExecutions')?.get('globalTransaction')) {
      return executable();
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

      return [null, createBackkErrorFromError(error)];
    }

    const [result, error] = await executable();

    if (error) {
      try {
        await this.tryRollbackTransaction();
      } catch (error) {
        return [null, createBackkErrorFromError(error)];
      }
    } else {
      try {
        await this.tryCommitTransaction();
      } catch (error) {
        return [null, createBackkErrorFromError(error)];
      }
    }

    this.getClsNamespace()?.set('globalTransaction', false);
    return [result, error];
  }

  async createEntity<T extends BackkEntity | SubEntity>(
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    entityClass: new () => T,
    options?: {
      preHooks?: CreatePreHook | CreatePreHook[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    },
    shouldReturnItem = true
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'createEntity');

    const response = await createEntity(
      this,
      entity,
      entityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations,
      false,
      shouldReturnItem
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  // noinspection OverlyComplexFunctionJS
  async addSubEntity<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntity: Omit<U, 'id'> | { _id: string },
    entityClass: new () => T,
    subEntityClass: new () => U,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntity');

    const response = await addSubEntities(
      this,
      _id,
      subEntitiesJsonPath,
      [newSubEntity],
      entityClass,
      subEntityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  // noinspection OverlyComplexFunctionJS
  async addSubEntities<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    options: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntities');

    const response = await addSubEntities(
      this,
      _id,
      subEntitiesJsonPath,
      newSubEntities,
      entityClass,
      subEntityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getAllEntities<T>(
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByFilters');
    const response = await getAllEntities(this, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByFilters');
    const response = await getEntitiesByFilters(this, filters, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntityByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityByFilters');

    const [response, error] = await getEntitiesByFilters(
      this,
      filters,
      EntityClass,
      postQueryOperations ?? new DefaultPostQueryOperations()
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);

    if (response?.length === 0) {
      return [
        null,
        createBackkErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS.ENTITY_NOT_FOUND,
          message: EntityClass.name + ' with given filter(s) not found'
        })
      ];
    }

    return [response ? response[0] : null, error];
  }

  async getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object | undefined,
    entityClass: new () => T
  ): PromiseOfErrorOr<number> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesCount');
    const response = await getEntitiesCount(this, filters, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntityById<T>(
    _id: string,
    entityClass: new () => T,
    options?: {
      postQueryOperations?: PostQueryOperations;
      postHook?: PostHook<T>;
    }
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityById');
    const response = await getEntityById(
      this,
      _id,
      entityClass,
      options?.postQueryOperations,
      options?.postHook
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<U> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntity');

    const [response, error] = await getSubEntities<T, U>(
      this,
      _id,
      subEntityPath,
      entityClass,
      postQueryOperations,
      'first'
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return [response ? response[0] : null, error];
  }

  async getSubEntities<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<U[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntities');
    const response = await getSubEntities<T, U>(
      this,
      _id,
      subEntityPath,
      entityClass,
      postQueryOperations,
      'all'
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByIds');
    const response = await getEntitiesByIds(this, _ids, entityClass, postQueryOperations);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    entityClass: new () => T,
    options?: {
      postQueryOperations?: PostQueryOperations;
      postHook?: PostHook<T>;
    },
    isSelectForUpdate = false
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityWhere');
    const response = await getEntityWhere(
      this,
      fieldPathName,
      fieldValue,
      entityClass,
      options?.postQueryOperations,
      options?.postHook,
      isSelectForUpdate
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesWhere');

    const response = await getEntitiesWhere(
      this,
      fieldPathName,
      fieldValue,
      entityClass,
      postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async updateEntity<T extends BackkEntity>(
    entity: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntity');
    const response = await updateEntity(
      this,
      entity,
      entityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async updateEntitiesByFilters<T extends object>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    entity: Partial<T>,
    EntityClass: new () => T
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntitiesByFilters');
    const response = await updateEntitiesByFilters(this, filters, entity, EntityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async updateEntityWhere<T extends BackkEntity>(
    fieldPathName: string,
    fieldValue: any,
    entity: RecursivePartial<T>,
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntityWhere');

    const response = await updateEntityWhere(
      this,
      fieldPathName,
      fieldValue,
      entity,
      EntityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteEntityById<T extends BackkEntity>(
    _id: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntityById');
    const response = await deleteEntityById(
      this,
      _id,
      EntityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations
    );
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteEntitiesWhere<T extends object>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntitiesWhere');
    const response = await deleteEntitiesWhere(this, fieldName, fieldValue, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteEntitiesByFilters<T extends object>(
    filters: Array<MongoDbQuery<T>> | SqlExpression[] | UserDefinedFilter[] | Partial<T> | object,
    entityClass: new () => T
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntitiesByFilters');
    const response = await deleteEntitiesByFilters(this, filters, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async removeSubEntities<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    entityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntities');

    const response = await removeSubEntities(
      this,
      _id,
      subEntitiesJsonPath,
      entityClass,
      options?.preHooks,
      options?.postHook,
      options?.postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async removeSubEntityById<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    subEntityId: string,
    entityClass: new () => T,
    options: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntityById');
    const subEntityJsonPath = `${subEntitiesJsonPath}[?(@.id == '${subEntityId}' || @._id == '${subEntityId}')]`;

    const response = await this.removeSubEntities(_id, subEntityJsonPath, entityClass, options);

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteAllEntities<T>(entityClass: new () => T): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteAllEntities');
    const response = await deleteAllEntities(this, entityClass);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }
}
