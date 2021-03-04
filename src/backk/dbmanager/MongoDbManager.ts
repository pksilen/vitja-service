import { Injectable } from '@nestjs/common';
import { FilterQuery, MongoClient, ObjectId } from 'mongodb';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { BackkEntity } from '../types/entities/BackkEntity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import createBackkErrorFromError from '../errors/createBackkErrorFromError';
import UserDefinedFilter from '../types/userdefinedfilters/UserDefinedFilter';
import { SubEntity } from '../types/entities/SubEntity';
import tryStartLocalTransactionIfNeeded from './sql/operations/transaction/tryStartLocalTransactionIfNeeded';
import tryExecutePreHooks from './hooks/tryExecutePreHooks';
import hashAndEncryptEntity from '../crypt/hashAndEncryptEntity';
import cleanupLocalTransactionIfNeeded from './sql/operations/transaction/cleanupLocalTransactionIfNeeded';
import { getNamespace } from 'cls-hooked';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';
import createInternalServerError from '../errors/createInternalServerError';
import getClassPropertyNameToPropertyTypeNameMap from '../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../decorators/typeproperty/typePropertyAnnotationContainer';
import isEntityTypeName from '../utils/type/isEntityTypeName';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import forEachAsyncSequential from '../utils/forEachAsyncSequential';
import startDbOperation from './utils/startDbOperation';
import recordDbOperationDuration from './utils/recordDbOperationDuration';
import { JSONPath } from 'jsonpath-plus';
import findParentEntityAndPropertyNameForSubEntity from '../metadata/findParentEntityAndPropertyNameForSubEntity';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import performPostQueryOperations from './mongodb/performPostQueryOperations';
import DefaultPostQueryOperations from '../types/postqueryoperations/DefaultPostQueryOperations';
import tryFetchAndAssignSubEntitiesForManyToManyRelationships from './mongodb/tryFetchAndAssignSubEntitiesForManyToManyRelationships';
import decryptEntities from '../crypt/decryptEntities';
import updateDbLocalTransactionCount from './sql/operations/dql/utils/updateDbLocalTransactionCount';
import shouldUseRandomInitializationVector from '../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../crypt/shouldEncryptValue';
import encrypt from '../crypt/encrypt';
import removePrivateProperties from './mongodb/removePrivateProperties';
import replaceIdStringsWithObjectIds from './mongodb/replaceIdStringsWithObjectIds';
import removeSubEntities from './mongodb/removeSubEntities';
import getJoinPipelines from './mongodb/getJoinPipelines';
import convertUserDefinedFiltersToMatchExpression from './mongodb/convertUserDefinedFiltersToMatchExpression';
import isUniqueField from './sql/operations/dql/utils/isUniqueField';
import MongoDbQuery from './mongodb/MongoDbQuery';
import getRootOperations from './mongodb/getRootOperations';
import convertMongoDbQueriesToMatchExpression from './mongodb/convertMongoDbQueriesToMatchExpression';
import paginateSubEntities from './mongodb/paginateSubEntities';
import convertFilterObjectToMongoDbQueries from './mongodb/convertFilterObjectToMongoDbQueries';
import { PostHook } from './hooks/PostHook';
import tryExecutePostHook from './hooks/tryExecutePostHook';
import getTableName from './utils/getTableName';
import getFieldOrdering from './mongodb/getFieldOrdering';
import createBackkErrorFromErrorCodeMessageAndStatus from '../errors/createBackkErrorFromErrorCodeMessageAndStatus';
import { BACKK_ERRORS } from '../errors/backkErrors';
import log, { Severity } from '../observability/logging/log';
import { CreatePreHook } from './hooks/CreatePreHook';
import tryExecuteCreatePreHooks from './hooks/tryExecuteCreatePreHooks';
import { PromiseOfErrorOr } from '../types/PromiseOfErrorOr';
import isBackkError from '../errors/isBackkError';
import { ErrorOr } from '../types/ErrorOr';

@Injectable()
export default class MongoDbManager extends AbstractDbManager {
  private mongoClient: MongoClient;

  constructor(private readonly uri: string, public readonly dbName: string) {
    super('');
    this.mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  getClient() {
    return this.mongoClient;
  }

  getIdColumnType(): string {
    throw new Error('Not implemented');
  }

  getTimestampType(): string {
    throw new Error('Not implemented');
  }

  getVarCharType(): string {
    throw new Error('Not implemented');
  }

  isDuplicateEntityError(): boolean {
    return false;
  }

  getModifyColumnStatement(): string {
    throw new Error('Not implemented');
  }

  getFilters<T>(
    mongoDbFilters: Array<MongoDbQuery<T>> | FilterQuery<T> | Partial<T> | object
  ): Array<MongoDbQuery<T> | SqlExpression> | Partial<T> | object {
    return Array.isArray(mongoDbFilters) ? mongoDbFilters : [new MongoDbQuery(mongoDbFilters)];
  }

  async tryExecute<T>(
    shouldUseTransaction: boolean,
    executeDbOperations: (client: MongoClient) => Promise<T>
  ): Promise<T> {
    if (this.getClsNamespace()?.get('remoteServiceCallCount') > 0) {
      this.getClsNamespace()?.set('dbManagerOperationAfterRemoteServiceCall', true);
    }

    try {
      if (shouldUseTransaction) {
        const session = this.getClsNamespace()?.get('session');
        if (!session) {
          throw new Error('Session not set');
        }

        let result: T | undefined;

        await session.withTransaction(async () => {
          result = await executeDbOperations(this.mongoClient);
        });

        return result as T;
      } else {
        return await executeDbOperations(this.mongoClient);
      }
    } catch (error) {
      log(Severity.ERROR, error.message, error.stack);
      throw error;
    }
  }

  tryExecuteSql<T>(): Promise<Field[]> {
    throw new Error('Not implemented');
  }

  tryExecuteSqlWithoutCls<T>(): Promise<Field[]> {
    throw new Error('Not implemented');
  }

  getDbManagerType(): string {
    return 'MongoDB';
  }

  getDbHost(): string {
    return this.uri;
  }

  async isDbReady(): Promise<boolean> {
    try {
      await this.tryReserveDbConnectionFromPool();

      await this.tryExecute(false, (client) =>
        client
          .db(this.dbName)
          .collection('__backk__')
          .findOne({})
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  async tryBeginTransaction(): Promise<void> {
    try {
      const session = this.getClient().startSession();
      this.getClsNamespace()?.set('session', session);
    } catch (error) {
      try {
        await this.mongoClient.close();
      } catch (error) {
        // NO OPERATION
      }

      this.mongoClient = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
      await this.tryReserveDbConnectionFromPool();
      this.getClsNamespace()?.set('session', this.getClient().startSession());
    }
  }

  cleanupTransaction() {
    this.getClsNamespace()
      ?.get('session')
      ?.endSession();
  }

  async executeInsideTransaction<T>(executable: () => PromiseOfErrorOr<T>): PromiseOfErrorOr<T> {
    if (getNamespace('multipleServiceFunctionExecutions')?.get('globalTransaction')) {
      return executable();
    }

    this.getClsNamespace()?.set('globalTransaction', true);

    let result: ErrorOr<T> = [null, createInternalServerError('Transaction execution error')];

    try {
      await this.tryBeginTransaction();
      const session = this.getClsNamespace()?.get('session');

      await session.withTransaction(async () => {
        result = await executable();
      });

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
    } finally {
      this.cleanupTransaction();
    }

    this.getClsNamespace()?.set('globalTransaction', false);
    return result;
  }

  async createEntity<T extends BackkEntity>(
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    EntityClass: new () => T,
    options?: {
      preHooks?: CreatePreHook | CreatePreHook[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    },
    isInternalCall = false
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'createEntity');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    const Types = this.getTypes();
    let shouldUseTransaction = false;

    try {
      await hashAndEncryptEntity(entity, EntityClass, Types);
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async (client) => {
        const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);
        Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]) => {
          if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
            delete (entity as any)[fieldName];
          }

          const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);

          if (!isArrayType && !isEntityTypeName(baseTypeName) && fieldName !== '_id') {
            if (fieldName === 'version') {
              (entity as any).version = '1';
            } else if (fieldName === 'lastModifiedTimestamp' || fieldName === 'createdAtTimestamp') {
              (entity as any)[fieldName] = new Date();
            }
          } else if (
            isArrayType &&
            isEntityTypeName(baseTypeName) &&
            typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)
          ) {
            (entity as any)[fieldName] = ((entity as any)[fieldName] ?? []).map(
              (subEntity: any) => subEntity._id
            );
          }
        });

        await tryExecuteCreatePreHooks(options?.preHooks ?? []);
        let createEntityResult;

        try {
          createEntityResult = await client
            .db(this.dbName)
            .collection(EntityClass.name.toLowerCase())
            .insertOne(entity);
        } catch (error) {
          if (error.message.startsWith('E11000 duplicate key error')) {
            return [
              null,
              createBackkErrorFromErrorCodeMessageAndStatus({
                ...BACKK_ERRORS.DUPLICATE_ENTITY,
                errorMessage: `Duplicate ${EntityClass.name.charAt(0).toLowerCase()}${EntityClass.name.slice(
                  1
                )}`
              })
            ];
          }

          throw error;
        }

        const _id = createEntityResult?.insertedId.toHexString();

        const [createdEntity, error] = isInternalCall
          ? ([{ _id } as T, null] as [T, null])
          : await this.getEntityById(_id, EntityClass, options?.postQueryOperations);

        if (options?.postHook) {
          await tryExecutePostHook(options?.postHook, createdEntity);
        }

        return [createdEntity, error];
      });
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  addSubEntity<T extends BackkEntity, U extends SubEntity>(
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

    const response = this.addSubEntities(
      _id,
      subEntitiesJsonPath,
      [newSubEntity],
      entityClass,
      subEntityClass,
      options
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async addSubEntities<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    // noinspection AssignmentToFunctionParameterJS
    SubEntityClass = this.getType(SubEntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async (client) => {
        const [currentEntity, error] = await this.getEntityById(_id, EntityClass, undefined, true, true);

        if (!currentEntity) {
          return [null, error];
        }

        await tryExecutePreHooks(options?.preHooks ?? [], currentEntity);
        const [parentEntity] = JSONPath({
          json: currentEntity,
          path: subEntitiesJsonPath + '^'
        });

        const [subEntities] = JSONPath({ json: currentEntity, path: subEntitiesJsonPath });
        const maxSubItemId = subEntities.reduce((maxSubItemId: number, subEntity: any) => {
          const subItemId = parseInt(subEntity.id, 10);
          return subItemId > maxSubItemId ? subItemId : maxSubItemId;
        }, -1);

        const parentEntityClassAndPropertyNameForSubEntity = findParentEntityAndPropertyNameForSubEntity(
          EntityClass,
          SubEntityClass,
          this.getTypes()
        );

        if (parentEntityClassAndPropertyNameForSubEntity) {
          const metadataForValidations = getFromContainer(MetadataStorage).getTargetValidationMetadatas(
            parentEntityClassAndPropertyNameForSubEntity[0],
            ''
          );

          const foundArrayMaxSizeValidation = metadataForValidations.find(
            (validationMetadata: ValidationMetadata) =>
              validationMetadata.propertyName === parentEntityClassAndPropertyNameForSubEntity[1] &&
              validationMetadata.type === 'arrayMaxSize'
          );

          if (
            foundArrayMaxSizeValidation &&
            maxSubItemId + newSubEntities.length >= foundArrayMaxSizeValidation.constraints[0]
          ) {
            // noinspection ExceptionCaughtLocallyJS
            throw createBackkErrorFromErrorCodeMessageAndStatus({
              ...BACKK_ERRORS.MAX_ENTITY_COUNT_REACHED,
              errorMessage:
                parentEntityClassAndPropertyNameForSubEntity[0].name +
                '.' +
                parentEntityClassAndPropertyNameForSubEntity[1] +
                ': ' +
                BACKK_ERRORS.MAX_ENTITY_COUNT_REACHED.errorMessage
            });
          }
        }

        await forEachAsyncParallel(newSubEntities, async (newSubEntity, index) => {
          if (
            parentEntityClassAndPropertyNameForSubEntity &&
            typePropertyAnnotationContainer.isTypePropertyManyToMany(
              parentEntityClassAndPropertyNameForSubEntity[0],
              parentEntityClassAndPropertyNameForSubEntity[1]
            )
          ) {
            parentEntity[parentEntityClassAndPropertyNameForSubEntity[1]].push(newSubEntity);
          } else if (parentEntityClassAndPropertyNameForSubEntity) {
            parentEntity[parentEntityClassAndPropertyNameForSubEntity[1]].push({
              ...newSubEntity,
              id: (maxSubItemId + 1 + index).toString()
            });
          }
        });

        await this.updateEntity(currentEntity as any, EntityClass, undefined, undefined, false, true);

        if (options?.postHook) {
          await tryExecutePostHook(options?.postHook, null);
        }

        return [null, null];
      });
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getAllEntities<T>(
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getAllEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

    try {
      const entities = await this.tryExecute(false, async (client) => {
        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection<T>(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match({});

        performPostQueryOperations(cursor, finalPostQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          undefined,
          finalPostQueryOperations
        );

        paginateSubEntities(rows, finalPostQueryOperations.paginations, EntityClass, this.getTypes());

        removePrivateProperties(rows, EntityClass, this.getTypes());
        decryptEntities(rows, EntityClass, this.getTypes(), false);
        return rows;
      });

      return [entities, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    let matchExpression: any;
    let finalFilters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression>;

    if (typeof filters === 'object' && !Array.isArray(filters)) {
      finalFilters = convertFilterObjectToMongoDbQueries(filters);
    } else {
      finalFilters = filters;
    }

    if (Array.isArray(finalFilters) && finalFilters?.find((filter) => filter instanceof SqlExpression)) {
      throw new Error('SqlExpression is not supported for MongoDB');
    } else {
      const rootFilters = getRootOperations(finalFilters, EntityClass, this.getTypes());
      const rootUserDefinedFilters = rootFilters.filter((filter) => !(filter instanceof MongoDbQuery));
      const rootMongoDbQueries = rootFilters.filter((filter) => filter instanceof MongoDbQuery);

      const userDefinedFiltersMatchExpression = convertUserDefinedFiltersToMatchExpression(
        rootUserDefinedFilters as UserDefinedFilter[]
      );

      const mongoDbQueriesMatchExpression = convertMongoDbQueriesToMatchExpression(
        rootMongoDbQueries as Array<MongoDbQuery<T>>
      );

      matchExpression = {
        ...userDefinedFiltersMatchExpression,
        ...mongoDbQueriesMatchExpression
      };
    }

    replaceIdStringsWithObjectIds(matchExpression);

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByFilters');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      const entities = await this.tryExecute(false, async (client) => {
        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection<T>(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match(matchExpression);

        performPostQueryOperations(cursor, postQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          finalFilters as Array<MongoDbQuery<T>>,
          postQueryOperations
        );

        paginateSubEntities(rows, postQueryOperations.paginations, EntityClass, this.getTypes());
        removePrivateProperties(rows, EntityClass, this.getTypes());
        decryptEntities(rows, EntityClass, this.getTypes(), false);
        return rows;
      });

      return [entities, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntityByFilters<T>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityByFilters');

    const [response, error] = await this.getEntitiesByFilters(
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
          errorMessage: `${EntityClass.name} with given filter(s) not found`
        })
      ];
    }

    return [response ? response[0] : null, error];
  }

  async getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | Partial<T> | object,
    EntityClass: new () => T
  ): PromiseOfErrorOr<number> {
    let matchExpression: object;
    let finalFilters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression>;

    if (typeof filters === 'object' && !Array.isArray(filters)) {
      finalFilters = convertFilterObjectToMongoDbQueries(filters);
    } else {
      finalFilters = filters;
    }

    if (Array.isArray(finalFilters) && finalFilters?.find((filter) => filter instanceof SqlExpression)) {
      throw new Error('SqlExpression is not supported for MongoDB');
    } else {
      const rootFilters = getRootOperations(finalFilters, EntityClass, this.getTypes());
      const rootUserDefinedFilters = rootFilters.filter((filter) => !(filter instanceof MongoDbQuery));
      const rootMongoDbQueries = rootFilters.filter((filter) => filter instanceof MongoDbQuery);

      const userDefinedFiltersMatchExpression = convertUserDefinedFiltersToMatchExpression(
        rootUserDefinedFilters as UserDefinedFilter[]
      );

      const mongoDbQueriesMatchExpression = convertMongoDbQueriesToMatchExpression(
        rootMongoDbQueries as Array<MongoDbQuery<T>>
      );

      matchExpression = {
        ...userDefinedFiltersMatchExpression,
        ...mongoDbQueriesMatchExpression
      };
    }

    replaceIdStringsWithObjectIds(matchExpression);

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesCount');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      const entityCount = await this.tryExecute(false, async (client) => {
        return client
          .db(this.dbName)
          .collection<T>(getTableName(EntityClass.name))
          .countDocuments(matchExpression);
      });

      return [entityCount, null];
    } catch (error) {
      return [null, createBackkErrorFromError(error)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntityById<T>(
    _id: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations,
    isSelectForUpdate = false,
    isInternalCall = false
  ): PromiseOfErrorOr<T> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityById');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      if (
        postQueryOperations?.includeResponseFields?.length === 1 &&
        postQueryOperations.includeResponseFields[0] === '_id'
      ) {
        return [({ _id } as unknown) as T, null];
      }

      return await this.tryExecute(false, async (client) => {
        if (isSelectForUpdate) {
          await client
            .db(this.dbName)
            .collection(EntityClass.name.toLowerCase())
            .findOneAndUpdate({ _id: new ObjectId(_id) }, { $set: { _backkLock: new ObjectId() } });
        }

        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection<T>(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match({ _id: new ObjectId(_id) });

        performPostQueryOperations(cursor, postQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        if (rows.length === 0) {
          return [
            null,
            createBackkErrorFromErrorCodeMessageAndStatus({
              ...BACKK_ERRORS.ENTITY_NOT_FOUND,
              errorMessage: `${EntityClass.name} with _id: ${_id} not found`
            })
          ];
        }

        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          undefined,
          postQueryOperations
        );

        paginateSubEntities(rows, postQueryOperations?.paginations, EntityClass, this.getTypes());
        removePrivateProperties(rows, EntityClass, this.getTypes(), isInternalCall);
        decryptEntities(rows, EntityClass, this.getTypes(), false);
        return [rows[0], null];
      });
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseOfErrorOr<U> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntity');
    const [response, error] = await this.getSubEntities<T, U>(
      _id,
      subEntityPath,
      EntityClass,
      postQueryOperations,
      'first'
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return [response ? response[0] : null, error];
  }

  async getSubEntities<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations,
    responseMode: 'first' | 'all' = 'all'
  ): PromiseOfErrorOr<U[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntities');
    updateDbLocalTransactionCount(this);
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      const [entity, error] = await this.getEntityById(_id, EntityClass, postQueryOperations);
      const subItems = JSONPath({ json: entity ?? null, path: subEntityPath });
      return responseMode === 'first' ? [[subItems?.[0]], error] : [subItems, error];
    } catch (error) {
      return [null, createBackkErrorFromError(error)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByIds');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      const entities = await this.tryExecute(false, async (client) => {
        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection<T>(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match({ _id: { $in: _ids.map((_id: string) => new ObjectId(_id)) } });

        performPostQueryOperations(cursor, postQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          undefined,
          postQueryOperations
        );

        paginateSubEntities(rows, postQueryOperations.paginations, EntityClass, this.getTypes());

        removePrivateProperties(rows, EntityClass, this.getTypes());
        decryptEntities(rows, EntityClass, this.getTypes(), false);
        return rows;
      });

      return [entities, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations,
    isSelectForUpdate = false
  ): PromiseOfErrorOr<T> {
    if (!isUniqueField(fieldPathName, EntityClass, this.getTypes())) {
      throw new Error(`Field ${fieldPathName} is not unique. Annotate entity field with @Unique annotation`);
    }

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityWhere');

    let finalFieldValue = fieldValue;
    const lastDotPosition = fieldPathName.lastIndexOf('.');
    const fieldName = lastDotPosition === -1 ? fieldPathName : fieldPathName.slice(lastDotPosition + 1);
    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      finalFieldValue = encrypt(fieldValue, false);
    }

    const filters = [
      new MongoDbQuery(
        { [fieldName]: finalFieldValue },
        lastDotPosition === -1 ? '' : fieldPathName.slice(0, lastDotPosition)
      )
    ];
    const rootFilters = getRootOperations(filters as Array<MongoDbQuery<T>>, EntityClass, this.getTypes());
    const matchExpression = convertMongoDbQueriesToMatchExpression(rootFilters);

    try {
      const entities = await this.tryExecute(false, async (client) => {
        if (isSelectForUpdate) {
          await client
            .db(this.dbName)
            .collection(EntityClass.name.toLowerCase())
            .findOneAndUpdate(matchExpression, { $set: { _backkLock: new ObjectId() } });
        }

        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match(matchExpression);

        performPostQueryOperations(cursor, postQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          filters as Array<MongoDbQuery<T>>,
          postQueryOperations
        );

        paginateSubEntities(rows, postQueryOperations?.paginations, EntityClass, this.getTypes());
        removePrivateProperties(rows, EntityClass, this.getTypes());
        decryptEntities(rows, EntityClass, this.getTypes(), false);
        return rows;
      });

      return entities.length === 0
        ? [
            null,
            createBackkErrorFromErrorCodeMessageAndStatus({
              ...BACKK_ERRORS.ENTITY_NOT_FOUND,
              errorMessage: `${EntityClass.name} with ${fieldName}: ${fieldValue} not found`
            })
          ]
        : [entities[0], null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseOfErrorOr<T[]> {
    if (!isUniqueField(fieldPathName, EntityClass, this.getTypes())) {
      throw new Error(`Field ${fieldPathName} is not unique. Annotate entity field with @Unique annotation`);
    }

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesWhere');

    let finalFieldValue = fieldValue;
    const lastDotPosition = fieldPathName.lastIndexOf('.');
    const fieldName = lastDotPosition === -1 ? fieldPathName : fieldPathName.slice(lastDotPosition + 1);
    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      finalFieldValue = encrypt(fieldValue, false);
    }

    const filters = [
      new MongoDbQuery(
        { [fieldName]: finalFieldValue },
        lastDotPosition === -1 ? '' : fieldPathName.slice(0, lastDotPosition)
      )
    ];

    const rootFilters = getRootOperations(filters as Array<MongoDbQuery<T>>, EntityClass, this.getTypes());
    const matchExpression = convertMongoDbQueriesToMatchExpression(rootFilters);

    try {
      const entities = await this.tryExecute(false, async (client) => {
        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match(matchExpression);

        performPostQueryOperations(cursor, postQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          filters as Array<MongoDbQuery<T>>,
          postQueryOperations
        );

        paginateSubEntities(rows, postQueryOperations?.paginations, EntityClass, this.getTypes());
        removePrivateProperties(rows, EntityClass, this.getTypes());
        decryptEntities(rows, EntityClass, this.getTypes(), false);
        return rows;
      });

      return entities.length === 0
        ? [
            null,
            createBackkErrorFromErrorCodeMessageAndStatus({
              ...BACKK_ERRORS.ENTITY_NOT_FOUND,
              errorMessage: `${EntityClass.name} with ${fieldName}: ${fieldValue} not found`
            })
          ]
        : [entities, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async updateEntity<T extends BackkEntity>(
    { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    },
    isRecursiveCall = false,
    isInternalCall = false
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntity');

    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    const Types = this.getTypes();
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      if (!isRecursiveCall) {
        await hashAndEncryptEntity(restOfEntity, EntityClass as any, Types);
      }
      return await this.tryExecute(shouldUseTransaction, async (client) => {
        let currentEntity: T | null | undefined = null;
        let error = null;

        if (!isRecursiveCall && options?.preHooks) {
          [currentEntity, error] = await this.getEntityById(
            _id,
            EntityClass,
            options?.postQueryOperations,
            true,
            true
          );
        }

        if (!currentEntity) {
          return [null, error];
        }

        let eTagCheckPreHook: PreHook<T>;
        let finalPreHooks = Array.isArray(options?.preHooks)
          ? options?.preHooks ?? []
          : options?.preHooks
          ? [options?.preHooks]
          : [];

        if (!isInternalCall && currentEntity) {
          if ('version' in currentEntity && restOfEntity.version && restOfEntity.version !== 'any') {
            eTagCheckPreHook = {
              isSuccessfulOrTrue: ({ version }) => version === restOfEntity.version,
              errorMessage: BACKK_ERRORS.ENTITY_VERSION_MISMATCH
            };

            finalPreHooks = [eTagCheckPreHook, ...finalPreHooks];
          } else if (
            'lastModifiedTimestamp' in currentEntity &&
            (restOfEntity as any).lastModifiedTimestamp &&
            (restOfEntity as any).lastModifiedTimestamp.getTime() !== 0
          ) {
            eTagCheckPreHook = {
              isSuccessfulOrTrue: ({ lastModifiedTimestamp }) =>
                lastModifiedTimestamp?.getTime() === (restOfEntity as any).lastModifiedTimestamp.getTime(),
              errorMessage: BACKK_ERRORS.ENTITY_LAST_MODIFIED_TIMESTAMP_MISMATCH
            };

            finalPreHooks = [eTagCheckPreHook, ...finalPreHooks];
          }
        }

        if (!isRecursiveCall) {
          await tryExecutePreHooks(finalPreHooks, currentEntity);
        }

        const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

        await forEachAsyncSequential(Object.entries(entityMetadata), async ([fieldName, fieldTypeName]) => {
          if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
            delete (restOfEntity as any)[fieldName];
          }

          const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
          const SubEntityClass = (Types as any)[baseTypeName];
          const newSubEntities = (restOfEntity as any)[fieldName];

          if (isArrayType && isEntityTypeName(baseTypeName) && newSubEntities) {
            const finalAllowAdditionAndRemovalForSubEntities = 'all';

            if (finalAllowAdditionAndRemovalForSubEntities === 'all') {
              if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
                (restOfEntity as any)[fieldName] = newSubEntities.map((subEntity: any) => subEntity._id);
              }
            } else {
              const currentSubEntities = (currentEntity as any)[fieldName];

              if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
                (restOfEntity as any)[fieldName] = currentSubEntities.map(
                  (currentSubEntity: any) => currentSubEntity._id
                );
              } else {
                (restOfEntity as any)[fieldName] = await Promise.all(
                  currentSubEntities.map(async (currentSubEntity: any) => {
                    const foundUpdatedSubEntity = newSubEntities.find(
                      (newSubEntity: any) => newSubEntity._id === currentSubEntity._id
                    );

                    if (foundUpdatedSubEntity) {
                      await hashAndEncryptEntity(currentSubEntity, SubEntityClass, Types);
                    }

                    return foundUpdatedSubEntity
                      ? { ...currentSubEntity, ...foundUpdatedSubEntity }
                      : undefined;
                  })
                );
              }
            }
          } else if (fieldName !== '_id') {
            if (fieldName === 'version') {
              (restOfEntity as any)[fieldName] = (
                parseInt(currentEntity?.version ?? (restOfEntity as any).version, 10) + 1
              ).toString();
            } else if (fieldName === 'lastModifiedTimestamp') {
              (restOfEntity as any)[fieldName] = new Date();
            }
          }
        });

        const updateOperationResult = await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .updateOne({ _id: new ObjectId(_id) }, { $set: restOfEntity });

        if (updateOperationResult.matchedCount !== 1) {
          return [
            null,
            createBackkErrorFromErrorCodeMessageAndStatus({
              ...BACKK_ERRORS.ENTITY_NOT_FOUND,
              errorMessage: EntityClass.name + ' with id: ' + _id + ' not found'
            })
          ];
        }

        if (!isRecursiveCall && options?.postHook) {
          await tryExecutePostHook(options.postHook, null);
        }

        return [null, null];
      });
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async updateEntityWhere<T extends BackkEntity>(
    fieldPathName: string,
    fieldValue: T[keyof T],
    entity: RecursivePartial<T>,
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntityWhere');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      await this.tryExecute(shouldUseTransaction, async () => {
        const [currentEntity, error] = await this.getEntityWhere(
          fieldPathName,
          fieldValue,
          EntityClass,
          options?.postQueryOperations,
          true
        );

        if (!currentEntity) {
          return [null, error];
        }

        await tryExecutePreHooks(options?.preHooks ?? [], currentEntity);
        await this.updateEntity({ _id: currentEntity._id, ...entity }, EntityClass, []);

        if (options?.postHook) {
          await tryExecutePostHook(options.postHook, null);
        }
      });

      return [null, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
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
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      await this.tryExecute(shouldUseTransaction, async (client) => {
        if (options?.preHooks) {
          const [currentEntity, error] = await this.getEntityById(
            _id,
            EntityClass,
            options?.postQueryOperations,
            true,
            true
          );

          if (!currentEntity) {
            return [null, error];
          }

          await tryExecutePreHooks(options?.preHooks, currentEntity);
        }

        await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .deleteOne({ _id: new ObjectId(_id) });

        if (options?.postHook) {
          await tryExecutePostHook(options?.postHook, null);
        }
      });

      return [null, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async deleteEntitiesWhere<T extends object>(
    fieldName: string,
    fieldValue: T[keyof T] | string,
    EntityClass: new () => T
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntitiesWhere');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
      if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
        // noinspection AssignmentToFunctionParameterJS
        fieldValue = encrypt(fieldValue as any, false);
      }

      await this.tryExecute(shouldUseTransaction, async (client) => {
        await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .deleteOne({ [fieldName]: fieldValue });
      });

      return [null, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async deleteEntitiesByFilters<T extends object>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | Partial<T> | object,
    EntityClass: new () => T
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntitiesByFilters');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;
    let matchExpression: any;
    let finalFilters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression>;

    if (typeof filters === 'object' && !Array.isArray(filters)) {
      finalFilters = convertFilterObjectToMongoDbQueries(filters);
    } else {
      finalFilters = filters;
    }

    if (Array.isArray(finalFilters) && finalFilters?.find((filter) => filter instanceof SqlExpression)) {
      throw new Error('SqlExpression is not supported for MongoDB');
    } else {
      const rootFilters = getRootOperations(finalFilters, EntityClass, this.getTypes());
      const rootUserDefinedFilters = rootFilters.filter((filter) => !(filter instanceof MongoDbQuery));
      const rootMongoDbQueries = rootFilters.filter((filter) => filter instanceof MongoDbQuery);

      const userDefinedFiltersMatchExpression = convertUserDefinedFiltersToMatchExpression(
        rootUserDefinedFilters as UserDefinedFilter[]
      );

      const mongoDbQueriesMatchExpression = convertMongoDbQueriesToMatchExpression(
        rootMongoDbQueries as Array<MongoDbQuery<T>>
      );

      matchExpression = {
        ...userDefinedFiltersMatchExpression,
        ...mongoDbQueriesMatchExpression
      };
    }

    replaceIdStringsWithObjectIds(matchExpression);

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      await this.tryExecute(shouldUseTransaction, async (client) => {
        await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .deleteMany(matchExpression);
      });

      return [null, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async removeSubEntities<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async () => {
        const [currentEntity, error] = await this.getEntityById(_id, EntityClass, undefined, true, true);
        if (!currentEntity) {
          throw error;
        }

        await tryExecutePreHooks(options?.preHooks ?? [], currentEntity);
        const subEntities = JSONPath({ json: currentEntity, path: subEntitiesJsonPath });

        if (subEntities.length > 0) {
          removeSubEntities(currentEntity, subEntities);
          await this.updateEntity(currentEntity as any, EntityClass, undefined, undefined, false, true);
        }

        if (options?.postHook) {
          await tryExecutePostHook(options.postHook, null);
        }

        return [null, null];
      });
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async removeSubEntityById<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    subEntityId: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook<T> | PreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntityById');
    const subEntityPath = `${subEntitiesJsonPath}[?(@.id == '${subEntityId}' || @._id == '${subEntityId}')]`;

    const response = await this.removeSubEntities(_id, subEntityPath, EntityClass, options);

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteAllEntities<T>(EntityClass: new () => T): PromiseOfErrorOr<null> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteAllEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      await this.tryExecute(shouldUseTransaction, async (client) => {
        await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .deleteMany({});
      });

      return [null, null];
    } catch (errorOrBackkError) {
      return isBackkError(errorOrBackkError)
        ? [null, errorOrBackkError]
        : [null, createBackkErrorFromError(errorOrBackkError)];
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  tryReleaseDbConnectionBackToPool() {
    // No operation
  }

  async tryReserveDbConnectionFromPool(): Promise<void> {
    if (!this.mongoClient.isConnected()) {
      await this.mongoClient.connect();
    }
  }

  shouldConvertTinyIntegersToBooleans(): boolean {
    return false;
  }
}
