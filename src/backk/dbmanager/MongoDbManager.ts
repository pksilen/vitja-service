import { Injectable } from '@nestjs/common';
import { FilterQuery, MongoClient, ObjectId } from 'mongodb';
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
import hashAndEncryptItem from '../crypt/hashAndEncryptItem';
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
import decryptItems from '../crypt/decryptItems';
import updateDbLocalTransactionCount from './sql/operations/dql/utils/updateDbLocalTransactionCount';
import shouldUseRandomInitializationVector from '../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../crypt/shouldEncryptValue';
import encrypt from '../crypt/encrypt';

@Injectable()
export default class MongoDbManager extends AbstractDbManager {
  private readonly mongoClient: MongoClient;

  constructor(private readonly uri: string, public readonly dbName: string) {
    super('');
    this.mongoClient = new MongoClient(uri, { useNewUrlParser: true });
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
    if (!this.mongoClient.isConnected()) {
      await this.mongoClient.connect();
    }

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

    let result: T | ErrorResponse = createInternalServerError('Transaction execution error');
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
    postQueryOperations?: PostQueryOperations,
    isRecursiveCall = false
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'createEntity');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    const Types = this.getTypes;
    let shouldUseTransaction = false;

    try {
      if (!isRecursiveCall) {
        await hashAndEncryptItem(entity, EntityClass, Types);
      }

      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async (client) => {
        const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);

        await forEachAsyncSequential(Object.entries(entityMetadata), async ([fieldName, fieldTypeName]) => {
          if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
            delete (entity as any)[fieldName];
          }

          const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);

          if (!isArrayType && !isEntityTypeName(baseTypeName) && fieldName !== '_id') {
            if (fieldName === 'version') {
              (entity as any).version = 1;
            } else if (fieldName === 'lastModifiedTimestamp' || fieldName === 'createdAtTimestamp') {
              (entity as any)[fieldName] = new Date();
            }
          } else if (isArrayType && isEntityTypeName(baseTypeName)) {
            if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)) {
              (entity as any)[fieldName] = (entity as any)[fieldName].map((subEntity: any) => subEntity._id);
            }
          }
        });

        await tryExecutePreHooks(preHooks);
        const createEntityResult = await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .insertOne(entity);

        const _id = createEntityResult.insertedId.toHexString();
        return isRecursiveCall
          ? ({ _id } as any)
          : await this.getEntityById(_id, EntityClass, postQueryOperations);
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      await cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  addSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntity');

    const response = this.addSubEntities(
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
    newSubEntities: Array<Omit<U, 'id'>>,
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'addSubEntity');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    // noinspection AssignmentToFunctionParameterJS
    SubEntityClass = this.getType(SubEntityClass);
    let shouldUseTransaction = false;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      return await this.tryExecute(shouldUseTransaction, async (client) => {
        const currentEntityOrErrorResponse = await this.getEntityById(_id, EntityClass, postQueryOperations);
        await tryExecutePreHooks(preHooks, currentEntityOrErrorResponse);
        await tryUpdateEntityVersionIfNeeded(this, currentEntityOrErrorResponse, EntityClass);
        await tryUpdateEntityLastModifiedTimestampIfNeeded(this, currentEntityOrErrorResponse, EntityClass);

        const maxSubItemId = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesPath }).reduce(
          (maxSubItemId: number, subItem: any) => {
            const subItemId = parseInt(subItem.id);
            return subItemId > maxSubItemId ? subItemId : maxSubItemId;
          },
          -1
        );

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
            let subEntityOrErrorResponse = await this.getEntityById(newSubEntity._id ?? '', SubEntityClass);
            if ('errorMessage' in subEntityOrErrorResponse) {
              subEntityOrErrorResponse = await this.createEntity(
                newSubEntity as any,
                SubEntityClass,
                undefined,
                undefined,
                false
              );
              if ('errorMessage' in subEntityOrErrorResponse) {
                // noinspection ExceptionCaughtLocallyJS
                throw subEntityOrErrorResponse;
              }
            }

            (currentEntityOrErrorResponse as any)[parentEntityClassAndPropertyNameForSubEntity[1]].push(
              subEntityOrErrorResponse._id
            );
          } else if (parentEntityClassAndPropertyNameForSubEntity) {
            (currentEntityOrErrorResponse as any)[parentEntityClassAndPropertyNameForSubEntity[1]].push(
              newSubEntity
            );
          }
        });

        delete (currentEntityOrErrorResponse as any)._id;

        await client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .updateOne({ _id: new ObjectId(_id) }, { $set: currentEntityOrErrorResponse });

        return await this.getEntityById(_id, EntityClass, postQueryOperations);
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      await cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
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
        const cursor = client
          .db(this.dbName)
          .collection<T>(EntityClass.name.toLowerCase())
          .find<T>();

        performPostQueryOperations(cursor, finalPostQueryOperations);
        const rows = await cursor.toArray();
        decryptItems(rows, EntityClass, this.getTypes());

        tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          finalPostQueryOperations
        );

        return rows;
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesByFilters<T>(
    filters: FilterQuery<T> | Partial<T> | UserDefinedFilter[] | SqlExpression[],
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    if (Array.isArray(filters) && filters?.[0] instanceof SqlExpression) {
      throw new Error('SqlExpression is not supported for MongoDB');
    }

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesByFilters');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      return await this.tryExecute(false, async (client) => {
        const cursor = client
          .db(this.dbName)
          .collection<T>(EntityClass.name.toLowerCase())
          .find<T>(filters as any);

        performPostQueryOperations(cursor, postQueryOperations);
        const rows = await cursor.toArray();
        decryptItems(rows, EntityClass, this.getTypes());

        tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          postQueryOperations
        );

        return rows;
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesCount<T>(
    filters: FilterQuery<T> | Partial<T> | UserDefinedFilter[] | SqlExpression[],
    EntityClass: new () => T
  ): Promise<number | ErrorResponse> {
    if (Array.isArray(filters) && filters?.[0] instanceof SqlExpression) {
      throw new Error('SqlExpression is not supported for MongoDB');
    }

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesCount');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      return await this.tryExecute(false, async (client) => {
        return await client
          .db(this.dbName)
          .collection<T>(EntityClass.name.toLowerCase())
          .countDocuments(filters as FilterQuery<T>);
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
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesCount');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);

    try {
      const entityOrErrorResponse = await this.tryExecute(false, async (client) => {
        const cursor = client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .find<T>({ _id: new ObjectId(_id) });

        performPostQueryOperations(cursor, postQueryOperations);
        const rows = await cursor.toArray();
        decryptItems(rows, EntityClass, this.getTypes());

        tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          postQueryOperations
        );

        if (rows.length === 0) {
          return createErrorResponseFromErrorMessageAndStatusCode(
            `Item with _id: ${_id} not found`,
            HttpStatusCodes.NOT_FOUND
          );
        }

        return rows[0];
      });

      return entityOrErrorResponse;
    } catch (error) {
      return createErrorResponseFromError(error);
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
        const cursor = client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .find<T>({ _id: { $in: _ids.map((_id: string) => new ObjectId(_id)) } });

        performPostQueryOperations(cursor, postQueryOperations);
        const rows = await cursor.toArray();
        decryptItems(rows, EntityClass, this.getTypes());

        tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          postQueryOperations
        );

        return rows;
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntityWhere<T>(
    fieldName: string,
    fieldValue: T[keyof T] | string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    if (
      !fieldName.includes('.') &&
      !typePropertyAnnotationContainer.isTypePropertyUnique(EntityClass, fieldName)
    ) {
      throw new Error(`Field ${EntityClass}.${fieldName} values must be annotated with @Unique annotation`);
    }

    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntityWhere');

    const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
    let finalFieldValue = fieldValue;
    if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
      finalFieldValue = encrypt(fieldValue as any, false);
    }

    try {
      const entities = await this.tryExecute(false, async (client) => {
        const cursor = client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .find<T>({ [fieldName]: finalFieldValue });

        performPostQueryOperations(cursor, postQueryOperations);
        const rows = await cursor.toArray();
        decryptItems(rows, EntityClass, this.getTypes());

        tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          postQueryOperations
        );

        return rows;
      });

      if (entities.length > 1) {
        return createErrorResponseFromErrorMessageAndStatusCode(
          `Field ${fieldName} values must be unique`,
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      return entities.length === 0
        ? createErrorResponseFromErrorMessageAndStatusCode(
            `Item with ${fieldName}: ${fieldValue} not found`,
            HttpStatusCodes.NOT_FOUND
          )
        : entities;
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async getEntitiesWhere<T>(
    fieldName: string,
    fieldValue: T[keyof T] | string,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'getEntitiesWhere');

    const lastFieldNamePart = fieldName.slice(fieldName.lastIndexOf('.') + 1);
    let finalFieldValue = fieldValue;
    if (!shouldUseRandomInitializationVector(lastFieldNamePart) && shouldEncryptValue(lastFieldNamePart)) {
      finalFieldValue = encrypt(fieldValue as any, false);
    }

    try {
      const entities = await this.tryExecute(false, async (client) => {
        const cursor = client
          .db(this.dbName)
          .collection(EntityClass.name.toLowerCase())
          .find<T>({ [fieldName]: finalFieldValue });

        performPostQueryOperations(cursor, postQueryOperations);
        const rows = await cursor.toArray();
        decryptItems(rows, EntityClass, this.getTypes());

        tryFetchAndAssignSubEntitiesForManyToManyRelationships(
          this,
          rows,
          EntityClass,
          this.getTypes(),
          postQueryOperations
        );

        return rows;
      });

      return entities.length === 0
        ? createErrorResponseFromErrorMessageAndStatusCode(
            `Item with ${fieldName}: ${fieldValue} not found`,
            HttpStatusCodes.NOT_FOUND
          )
        : entities;
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  async updateEntity<T extends Entity>(
    { _id, id, ...restOfEntity }: RecursivePartial<T> & { _id: string },
    EntityClass: new () => T,
    allowAdditionAndRemovalForSubEntityClasses: (new () => any)[] | 'all',
    preHooks?: PreHook | PreHook[],
    isRecursiveCall = false
  ): Promise<void | ErrorResponse> {
    const dbOperationStartTimeInMillis = startDbOperation(this, 'UpdateEntity');
    // noinspection AssignmentToFunctionParameterJS
    EntityClass = this.getType(EntityClass);
    const finalAllowAdditionAndRemovalForSubEntities = Array.isArray(
      allowAdditionAndRemovalForSubEntityClasses
    )
      ? allowAdditionAndRemovalForSubEntityClasses.map((SubEntityClass) => this.getType(SubEntityClass))
      : allowAdditionAndRemovalForSubEntityClasses;
    const Types = this.getTypes();
    let shouldUseTransaction;

    try {
      shouldUseTransaction = await tryStartLocalTransactionIfNeeded(this);

      if (!isRecursiveCall) {
        await hashAndEncryptItem(restOfEntity, EntityClass as any, Types);
      }

      await this.tryExecute(shouldUseTransaction, async (client) => {
        let currentEntityOrErrorResponse: T | ErrorResponse | undefined;
        if (!isRecursiveCall || allowAdditionAndRemovalForSubEntityClasses) {
          currentEntityOrErrorResponse = await this.getEntityById(_id ?? id, EntityClass, undefined);
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

          if (isArrayType && isEntityTypeName(baseTypeName)) {
            const newSubEntities = (restOfEntity as any)[fieldName];

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
                (restOfEntity as any)[fieldName] = currentSubEntities.map((currentSubEntity: any) => {
                  const foundUpdatedSubEntity = newSubEntities.find(
                    (newSubEntity: any) => newSubEntity._id === currentSubEntity._id
                  );
                  return foundUpdatedSubEntity ? foundUpdatedSubEntity : currentSubEntity;
                });
              }
            }
          } else if (fieldName !== '_id' && fieldName !== 'id') {
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

        return undefined;
      });
    } catch (error) {
      return createErrorResponseFromError(error);
    } finally {
      await cleanupLocalTransactionIfNeeded(shouldUseTransaction, this);
      recordDbOperationDuration(this, dbOperationStartTimeInMillis);
    }
  }

  updateEntityWhere<T extends Entity>(
    fieldName: string,
    fieldValue: T[keyof T],
    entity: RecursivePartial<T>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  async deleteEntityById<T>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    try {
      const deleteOperationResult = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .deleteOne({ _id: new ObjectId(_id) })
      );

      if (deleteOperationResult.deletedCount !== 1) {
        return createErrorResponseFromErrorMessageAndStatusCode(`Item with _id: ${_id} not found`, 404);
      }
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  deleteEntitiesWhere<T extends object>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  deleteEntitiesByFilters<T extends object>(
    filters: FilterQuery<T> | Partial<T> | SqlExpression[] | UserDefinedFilter[],
    entityClass: new () => T
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  removeSubEntities<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    // auto-update version/lastmodifiedtimestamp
    return Promise.resolve();
  }

  removeSubEntityById<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    subEntityId: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    // auto-update version/lastmodifiedtimestamp
    return Promise.resolve();
  }

  async deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    try {
      await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .deleteMany({})
      );
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  tryReleaseDbConnectionBackToPool() {
    // TODO inmplement
  }

  tryReserveDbConnectionFromPool(): Promise<void> {
    // TODO inmplement
    return Promise.resolve(undefined);
  }
}
