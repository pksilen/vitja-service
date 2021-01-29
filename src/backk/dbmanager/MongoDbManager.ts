import { Injectable } from '@nestjs/common';
import { MongoClient, ObjectId } from 'mongodb';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import { ErrorResponse } from '../types/ErrorResponse';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { Entity } from '../types/entities/Entity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import createErrorResponseFromErrorMessageAndStatusCode from '../errors/createErrorResponseFromErrorMessageAndStatusCode';
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
import tryUpdateEntityVersionIfNeeded from './sql/operations/dml/utils/tryUpdateEntityVersionIfNeeded';
import tryUpdateEntityLastModifiedTimestampIfNeeded from './sql/operations/dml/utils/tryUpdateEntityLastModifiedTimestampIfNeeded';
import { JSONPath } from 'jsonpath-plus';
import findParentEntityAndPropertyNameForSubEntity from '../metadata/findParentEntityAndPropertyNameForSubEntity';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { HttpStatusCodes } from '../constants/constants';
import performPostQueryOperations from './mongodb/performPostQueryOperations';
import DefaultPostQueryOperations from '../types/postqueryoperations/DefaultPostQueryOperations';
import tryFetchAndAssignSubEntitiesForManyToManyRelationships from './mongodb/tryFetchAndAssignSubEntitiesForManyToManyRelationships';
import decryptEntities from '../crypt/decryptEntities';
import updateDbLocalTransactionCount from './sql/operations/dql/utils/updateDbLocalTransactionCount';
import shouldUseRandomInitializationVector from '../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../crypt/shouldEncryptValue';
import encrypt from '../crypt/encrypt';
import isErrorResponse from '../errors/isErrorResponse';
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

@Injectable()
export default class MongoDbManager extends AbstractDbManager {
  private readonly mongoClient: MongoClient;

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

  async tryExecute(
    shouldUseTransaction: boolean,
    executeDbOperations: (client: MongoClient) => Promise<any>
  ): Promise<any> {
    if (shouldUseTransaction) {
      const session = this.getClsNamespace()?.get('session');
      if (!session) {
        throw new Error('Session not set');
      }

      let result;
      await session.withTransaction(async () => {
        result = await executeDbOperations(this.mongoClient);
      });
      return result;
    } else {
      return await executeDbOperations(this.mongoClient);
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

  tryBeginTransaction(): Promise<void> {
    this.getClsNamespace()?.set('session', this.getClient().startSession());
    return Promise.resolve();
  }

  cleanupTransaction() {
    this.getClsNamespace()
      ?.get('session')
      ?.endSession();
  }

  async executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse> {
    if (getNamespace('multipleServiceFunctionExecutions')?.get('globalTransaction')) {
      return await executable();
    }

    this.getClsNamespace()?.set('globalTransaction', true);

    let result: T | ErrorResponse = createInternalServerError(
      'Transaction execution errorMessageOnPreHookFuncFailure'
    );
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
      result = createErrorResponseFromError(error);
    } finally {
      this.cleanupTransaction();
    }

    this.getClsNamespace()?.set('globalTransaction', false);

    return result;
  }

  async createEntity<T>(
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    EntityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations,
    isInternalCall = false
  ): Promise<T | ErrorResponse> {
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
          } else if (isArrayType && isEntityTypeName(baseTypeName)) {
            if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
              (entity as any)[fieldName] = ((entity as any)[fieldName] ?? []).map(
                (subEntity: any) => subEntity._id
              );
            }
          }
        });

        await tryExecutePreHooks(preHooks);

        const createEntityResult = await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .insertOne(entity);

        const _id = createEntityResult.insertedId.toHexString();

        const response = isInternalCall
          ? ({ _id } as any)
          : await this.getEntityById(_id, EntityClass, postQueryOperations);

        if (postHook) {
          await tryExecutePostHook(postHook, response);
        }

        return response;
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  addSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntity: Omit<U, 'id'> | { _id: string },
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntity');

    const response = this.addSubEntities(
      _id,
      subEntitiesJsonPath,
      [newSubEntity],
      entityClass,
      subEntityClass,
      preHooks,
      postHook,
      postQueryOperations
    );

    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async addSubEntities<T extends Entity, U extends SubEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    // noinspection AssignmentToFunctionParameterJS
    SubEntityClass = this.getType(SubEntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async (client) => {
        const currentEntityOrErrorResponse = await this.getEntityById(
          _id,
          EntityClass,
          postQueryOperations,
          true
        );

        await tryExecutePreHooks(preHooks, currentEntityOrErrorResponse);

        const [parentEntity] = JSONPath({
          json: currentEntityOrErrorResponse,
          path: subEntitiesJsonPath + '^'
        });

        const [subEntities] = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesJsonPath });
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
            throw createErrorResponseFromErrorMessageAndStatusCode(
              parentEntityClassAndPropertyNameForSubEntity[0].name +
                '.' +
                parentEntityClassAndPropertyNameForSubEntity[1] +
                ': Cannot add new entity. Maximum allowed entities limit reached',
              HttpStatusCodes.BAD_REQUEST
            );
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

        await this.updateEntity(currentEntityOrErrorResponse as any, EntityClass, 'all');
        const response = await this.getEntityById(_id, EntityClass, postQueryOperations);

        if (postHook) {
          await tryExecutePostHook(postHook, response);
        }

        return response;
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getAllEntities<T>(
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getAllEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

    try {
      return await this.tryExecute(false, async (client) => {
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
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | object,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
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
      return await this.tryExecute(false, async (client) => {
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
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | object,
    EntityClass: new () => T
  ): Promise<number | ErrorResponse> {
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
      return await this.tryExecute(false, async (client) => {
        return await client
          .db(this.dbName)
          .collection<T>(getTableName(EntityClass.name))
          .countDocuments(matchExpression);
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntityById<T>(
    _id: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations,
    isInternalCall = false
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesCount');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      return await this.tryExecute(false, async (client) => {
        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection(getTableName(EntityClass.name))
          .aggregate([...joinPipelines, getFieldOrdering(EntityClass)])
          .match({ _id: new ObjectId(_id) });

        performPostQueryOperations(cursor, postQueryOperations, EntityClass, this.getTypes());
        const rows = await cursor.toArray();

        if (rows.length === 0) {
          return createErrorResponseFromErrorMessageAndStatusCode(
            `Item with _id: ${_id} not found`,
            HttpStatusCodes.NOT_FOUND
          );
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
        return rows[0];
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<U | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntity');
    const response = this.getSubEntities(_id, subEntityPath, EntityClass, postQueryOperations, 'first');
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async getSubEntities<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations,
    responseMode: 'first' | 'all' = 'all'
  ): Promise<any | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getSubEntities');
    updateDbLocalTransactionCount(this);
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      const itemOrErrorResponse = await this.getEntityById(_id, EntityClass, postQueryOperations);
      if ('errorMessage' in itemOrErrorResponse) {
        return itemOrErrorResponse;
      }

      const subItems = JSONPath({ json: itemOrErrorResponse, path: subEntityPath });

      if (subItems.length > 0) {
        return responseMode === 'first' ? subItems[0] : subItems;
      } else {
        return createErrorResponseFromErrorMessageAndStatusCode(
          'Item with _id: ' + _id + ', sub item from path ' + subEntityPath + ' not found',
          HttpStatusCodes.NOT_FOUND
        );
      }
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByIds');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      return await this.tryExecute(false, async (client) => {
        const joinPipelines = getJoinPipelines(EntityClass, this.getTypes());

        const cursor = client
          .db(this.dbName)
          .collection(getTableName(EntityClass.name))
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
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
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
        ? createErrorResponseFromErrorMessageAndStatusCode(
            `Item with ${fieldName}: ${fieldValue} not found`,
            HttpStatusCodes.NOT_FOUND
          )
        : entities[0];
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
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
        ? createErrorResponseFromErrorMessageAndStatusCode(
            `Item with ${fieldName}: ${fieldValue} not found`,
            HttpStatusCodes.NOT_FOUND
          )
        : entities;
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async updateEntity<T extends Entity>(
    { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
    EntityClass: new () => T,
    allowAdditionAndRemovalForSubEntityClasses: (new () => any)[] | 'all',
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook,
    isRecursiveCall = false
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntity');

    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    const finalAllowAdditionAndRemovalForSubEntities = Array.isArray(
      allowAdditionAndRemovalForSubEntityClasses
    )
      ? allowAdditionAndRemovalForSubEntityClasses.map((SubEntityClass) => this.getType(SubEntityClass))
      : allowAdditionAndRemovalForSubEntityClasses;

    const Types = this.getTypes();
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      if (!isRecursiveCall) {
        await hashAndEncryptEntity(restOfEntity, EntityClass as any, Types);
      }

      await this.tryExecute(shouldUseTransaction, async (client) => {
        let currentEntityOrErrorResponse: T | ErrorResponse | undefined;
        if (!isRecursiveCall && (preHooks || allowAdditionAndRemovalForSubEntityClasses !== 'all')) {
          currentEntityOrErrorResponse = await this.getEntityById(_id, EntityClass, undefined, true);
        }

        if (!isRecursiveCall) {
          await tryExecutePreHooks(preHooks, currentEntityOrErrorResponse);
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
            if (
              finalAllowAdditionAndRemovalForSubEntities === 'all' ||
              finalAllowAdditionAndRemovalForSubEntities?.includes(SubEntityClass)
            ) {
              if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
                (restOfEntity as any)[fieldName] = newSubEntities.map((subEntity: any) => subEntity._id);
              }
            } else {
              const currentSubEntities = (currentEntityOrErrorResponse as any)[fieldName];

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
                parseInt((currentEntityOrErrorResponse as any).version, 10) + 1
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
          return createErrorResponseFromErrorMessageAndStatusCode(`Item with _id: ${_id} not found`, 404);
        }

        if (!isRecursiveCall && postHook) {
          await tryExecutePostHook(postHook);
        }
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async updateEntityWhere<T extends Entity>(
    fieldPathName: string,
    fieldValue: T[keyof T],
    entity: RecursivePartial<T>,
    EntityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'updateEntityWhere');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async () => {
        const currentEntityOrErrorResponse = await this.getEntityWhere(
          fieldPathName,
          fieldValue,
          EntityClass
        );

        await tryExecutePreHooks(preHooks, currentEntityOrErrorResponse);

        await this.updateEntity({ _id: (currentEntityOrErrorResponse as T)._id, ...entity }, EntityClass, []);

        if (postHook) {
          await tryExecutePostHook(postHook);
        }
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async deleteEntityById<T extends object>(
    _id: string,
    EntityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'deleteEntityById');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async (client) => {
        if (preHooks) {
          const entityOrErrorResponse = await this.getEntityById(_id, EntityClass, undefined, true);
          await tryExecutePreHooks(preHooks, entityOrErrorResponse);
        }

        await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .deleteOne({ _id: new ObjectId(_id) });

        if (postHook) {
          await tryExecutePostHook(postHook);
        }
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async deleteEntitiesWhere<T extends object>(
    fieldName: string,
    fieldValue: T[keyof T] | string,
    EntityClass: new () => T
  ): Promise<void | ErrorResponse> {
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
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async deleteEntitiesByFilters<T extends object>(
    filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | object,
    EntityClass: new () => T
  ): Promise<void | ErrorResponse> {
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
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async removeSubEntities<T extends Entity>(
    _id: string,
    subEntitiesJsonPath: string,
    EntityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntities');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      await this.tryExecute(shouldUseTransaction, async () => {
        const currentEntityOrErrorResponse = await this.getEntityById(_id, EntityClass, undefined, true);
        await tryExecutePreHooks(preHooks, currentEntityOrErrorResponse);
        await tryUpdateEntityVersionIfNeeded(this, currentEntityOrErrorResponse, EntityClass);
        await tryUpdateEntityLastModifiedTimestampIfNeeded(this, currentEntityOrErrorResponse, EntityClass);
        const subEntities = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesJsonPath });

        if (subEntities.length === 0) {
          return;
        }

        removeSubEntities(currentEntityOrErrorResponse, subEntities);
        this.updateEntity(currentEntityOrErrorResponse as any, EntityClass, 'all');

        if (postHook) {
          await tryExecutePostHook(postHook);
        }
      });
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
    } finally {
      cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  removeSubEntityById<T extends Entity>(
    _id: string,
    subEntitiesJsonPath: string,
    subEntityId: string,
    EntityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postHook?: PostHook
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'removeSubEntityById');
    const subEntityPath = `${subEntitiesJsonPath}[?(@.id == '${subEntityId}' || @._id == '${subEntityId}')]`;
    const response = this.removeSubEntities(_id, subEntityPath, EntityClass, preHooks, postHook);
    recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    return response;
  }

  async deleteAllEntities<T>(EntityClass: new () => T): Promise<void | ErrorResponse> {
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
    } catch (errorOrErrorResponse) {
      return isErrorResponse(errorOrErrorResponse)
        ? errorOrErrorResponse
        : createErrorResponseFromError(errorOrErrorResponse);
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
}
